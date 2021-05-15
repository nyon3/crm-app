import React, { useState, useEffect } from 'react';
import 'firebase/firestore'
import firebase from 'firebase/app'
import initFirebase from '../utils/auth/initFirebase';
import dayjs from 'dayjs';
import { Button } from '@material-ui/core';
import CircularProgress from '@material-ui/core/CircularProgress';
import MuiAlert from '@material-ui/lab/Alert';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';

// Components
import { getTotalTime } from "../utils/date/getTotalTime";
import { createHourArray, createMinuteArray } from "../utils/date/timeArray";

initFirebase()
const db = firebase.firestore();
const FirebaseStore = ({ data }) => {
    // HACK Can I reduce some fo states?
    const [realTimeUserInfo, setRealTimeUserInfo] = useState([]);
    const [hour, setHour] = useState(0);
    const [minute, setMinute] = useState(0)
    const [dialog, setDialog] = useState(false);
    const [processing, setProcessing] = useState('');
    const [succeeded, setSucceeded] = useState(false);
    const [disabled, setDisabled] = useState(true)
    const [isLoaded, setisLoaded] = useState(false)

    function resetAll() {
        const historyRef = db.collection('users').where('history', '!=', []);

        historyRef.get().then(querySnapshot => {
            // var removedData = realTimeUserInfo.history.splice(0);
            querySnapshot.forEach(doc => {
                doc.ref.update({ history: [] })
            });
        }).catch((err) => console.log(err));
        setDialog(false);
    }

    const redoFunction = () => {
        setProcessing(true)
        db.collection('users').get().then(querySnapshot => {
            var last = realTimeUserInfo.history.slice(-1)[0];
            querySnapshot.forEach(doc => {
                doc.ref.update({ history: firebase.firestore.FieldValue.arrayRemove(last) })
            });
        }).then(() => {
            setTimeout(() => {
                setSucceeded(true)
                setProcessing(false)
            }, 1500);
            console.log('delete previous date')
        }).catch((err) => console.log(err));
    }

    // 入店時間と退店時間を比較して、トータル時間を計算
    // HACK Can I merge this function to submitTime ??
    function countTime(hour, minute) {
        // Today's date.
        const dateFrom = dayjs();
        const dateTo = dayjs().hour(hour).minute(minute);

        //   Calculate difference between start time and end time.
        const difference = dateFrom.diff(dateTo, 'minute');

        // the number of the time deference.
        return new Promise(res => {
            res(Math.ceil(difference % 60 / 15) * 15 - (difference % 60) + difference)
        })
    }

    // FIXME Can't send same hour twice continuously.
    const submitTime = async () => {
        setProcessing(true)

        // Calculate time difference.
        const submitHours = await countTime(hour, minute);

        const docRef = db.collection('users')
        const query = docRef.where('name', '==', realTimeUserInfo.name);

        // HACK Add a Timestamp date for Today.
        const time = firebase.firestore.Timestamp.fromDate(new Date("November 8, 1815"))

        // Update database value: history
        // FIXME  No matter how date was send, this code return successful result...
        query.get().then(snapshots => {
            snapshots.forEach(snapshot => {
                docRef.doc(snapshot.id).update({ history: firebase.firestore.FieldValue.arrayUnion(submitHours) });
            });
        }).then(() => {
            setTimeout(() => {
                setSucceeded(true)
                setProcessing(false)
            }, 1500);
        }).catch((err) => console.log(err));
    }


    // Customer's info component.
    const timeManager = (data) => {
        // NOTE: 一度読み込んで配列に入っている、顧客情報を読み込んでfirebaseに何度もアクセスしないように設計した。
        if (isLoaded) {
            const result = data.history

            // TODO show customer's REALTIME DATA!
            let userData = [];

            db.collection('users').where('name', '==', data.name)
                .onSnapshot((snapshot) => {
                    snapshot.docChanges()
                        .forEach((change) => {
                            if (change.type === 'added') {
                                userData.push(change.doc.data().history);
                                console.log("Current userData: ", userData.join(", "));
                            }
                        });
                });
            let total = userData.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
            console.log(userData);
            return `${min2hour(data.spentTime - total)}`
        } else { return `N/a` }

    }

    // Change format of time.
    function min2hour(time) {
        var hour = Math.floor(time / 60);
        var min = time % 60;
        return (`${hour} : ${min}`)
    }

    // HACK fix error handling.
    async function getUserInfo(name) {
        db.collection('users').where('name', '==', name).get().then(snapshot => {
            snapshot.forEach(async doc => {
                if (doc.exists) {
                    setRealTimeUserInfo(doc.data())
                    setisLoaded(true)
                } else {
                    setisLoaded(false)
                    return Promise.reject("No such document");
                }
            })
        })
    }

    function Alert(props) {
        return <MuiAlert elevation={6} variant="filled" {...props} />;
    }

    // リセットダイアログを開く
    const dialogOpen = () => {
        setDialog(true);
    };
    // リセットダイアログを閉じる
    const dialogClose = () => {
        setDialog(false);
    };
    // 登録成功の表示を閉じる
    // TODO auto fade out submit success banner.
    const handleClose = () => setSucceeded(false)
    // Create User interface.
    return (
        <>
            <h2>{realTimeUserInfo.name}様　本日の滞在時間は　{getTotalTime(hour, minute)}</h2>

            <h2>残り時間は {timeManager(realTimeUserInfo)} </h2>

            <p>来店時間は</p>
            <select name="" id=""
                onChange={(e) => {
                    getUserInfo(e.target.value);
                    setDisabled(false)
                }}>
                <option value="Hour">Guest</option>
                {data.map(user => <option value={user.name} key={user.id}>{user.name}</option>)}
            </select>
            <select name="Hour" id=""
                onChange={(e) => setHour(e.target.value)}>
                <option value="Hour">Hour</option>
                {createHourArray(30)}
            </select>
            <select name="Minute" id=""
                onChange={(e) => setMinute(e.target.value)}>
                <option value="Minute">Minute</option>
                {createMinuteArray(60)}
            </select>
            <br />
            <br />
            <br />
            {processing ? (<CircularProgress />) : (
                <Button
                    disabled={disabled}
                    variant="contained"
                    color="primary"
                    onClick={() => { submitTime() }}>
                    PLUS
                </Button>
            )}
            {processing ? (
                <Button
                    disabled={true}>
                    MINUS
                </Button>
            ) : (
                <Button
                    disabled={disabled}
                    variant="contained"
                    color="default"
                    onClick={() => { redoFunction() }}>
                    MINUS
                </Button>
            )}
            <Button
                variant="contained"
                color="secondary"
                onClick={dialogOpen}>
                RESET
            </Button>
            <Dialog
                open={dialog}
                onClose={dialogClose}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">{"CAUTION!"}</DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        Are you sure, you want to RESET all of the date?
          </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={dialogClose} color="primary">
                        Disagree
          </Button>
                    <Button onClick={() => resetAll()} color="primary" autoFocus>
                        Agree
          </Button>
                </DialogActions>
            </Dialog >
            <br />
            { succeeded ? (
                <Alert onClose={handleClose} severity="success">
                    This is a success message!
                </Alert>
            ) : ('')
            }
        </>
    )
}

export default FirebaseStore

