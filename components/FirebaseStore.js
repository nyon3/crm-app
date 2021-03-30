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

const FirebaseStore = () => {
    // Todo 状態管理が多すぎるのでなんとかできないか？
    const [setRealTimeUser, setRealTimeUserInfo] = useState([]);
    const [hour, setHour] = useState(0);
    const [minute, setMinute] = useState(0)
    const [name, setName] = useState('');
    const [dialog, setDialog] = useState(false);
    const [processing, setProcessing] = useState('');
    const [succeeded, setSucceeded] = useState(false);
    const [disabled, setDisabled] = useState(true)

    // firestore customer query.
    const docRef = db.collection('users')
    const query = docRef.where('name', '==', name);

    // アプリをあけたらカスタマー情報を更新する 
    // TODO:>  新しいライブラリで、書き換える
    useEffect(() => {
        docRef.onSnapshot(async (snapshot) => {
            let userInfo = []
            await Promise.all(snapshot.docs.map(async (doc) => {
                userInfo.push({
                    userId: doc.id,
                    ...doc.data()
                })
            }))
            setRealTimeUserInfo(userInfo)
        })
    }, [])

    // Make user list for option 
    const members = setRealTimeUser.map(user => {
        return (
            <option value={user.name}>{user.name}</option>
        )
    })

    // reset all customer's spending time on database.　
    function resetAll() {
        docRef.get().then(querySnapshot => {
            querySnapshot.forEach(doc => {
                if (doc.data().membership == 'lite') {
                    doc.ref.update({
                        spentTime: 300
                    });
                } else {
                    doc.ref.update({
                        spentTime: 720
                    });
                }
            });
        }).then(() => console.log('reset all data')).catch((err) => console.log(err));
        setDialog(false);
    }

    // 入店時間と退店時間を比較して、トータル時間を計算
    function countTime(hour, minute) {
        const dateFrom = dayjs();
        const dateTo = dayjs().hour(hour).minute(minute);

        //   Calculate difference between start time and end time.
        const difference = dateFrom.diff(dateTo, 'minute');

        // the number of the time deference.
        return new Promise(res => {
            res(Math.ceil(difference % 60 / 15) * 15 - (difference % 60) + difference)
        })
    }

    const sendDate = (hours) => {
        query.get().then(snapshots => {
            snapshots.forEach(snapshot => {
                docRef.doc(snapshot.id).update({ spentTime: firebase.firestore.FieldValue.increment(hours) })
            });
        }).then(() => {
            setSucceeded(true)
            setProcessing(false)
        }).catch((err) => console.log(err));
    }

    // Send a Redo time to firestore.
    const getRedoTime = async () => {
        // TODO Ommit this valu to React Hooks (reducer)
        const submitHours = await countTime(hour, minute);
       sendDate(submitHours)  
    }

    // Send a reduce time to firestore.
    const reduceTime = async () => {
        setProcessing(true)
        // TODO Ommit this valu to React Hooks (reducer)
        const submitHours = await countTime(hour, minute) * -1;
        // トータル時間をデータベースに送信する
        sendDate(submitHours)
    }


    // TODO fix this function . Display selected user status.
    const userInfo = setRealTimeUser.map(user => {
        function min2hour(time) {
            var hour = Math.floor(time / 60);
            var min = time % 60;

            return (`${hour} : ${min}`)
        }
        if (user.name == name) {
            return <p>{`${user.name} 様の`} <strong> {`残り時間は ${min2hour(user.spentTime)}`}</strong></p>
        }
    })


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
    const handleClose = () => setSucceeded(false)

    // Create User interface.
    return (
        <>
            <h2>お客様は</h2>
            <select name="" id=""
                onChange={(e) => {
                    setName(e.target.value);
                    setDisabled(false)
                }}>
                <option value="Hour">Guest</option>
                {members}
            </select>
            <ul>{userInfo}</ul>
            <h2>来店時間は</h2>
            <select name="Hour" id=""
                onChange={(e) => setHour(e.target.value)}>
                <option value="Hour">Hour</option>
                {createHourArray(5)}
            </select>
            <select name="Minute" id=""
                onChange={(e) => setMinute(e.target.value)}>
                <option value="Minute">Minute</option>
                {createMinuteArray(60)}
            </select>
            <br />
            <div>
                <p className='totalTime_subTitle'>今日の滞在時間は</p>
                <h2 className='totalTime_title'> {getTotalTime(hour, minute)}</h2>
            </div>
            <br />
            <br />
            {processing ? (<CircularProgress />) : (
                <Button
                    disabled={disabled}
                    variant="contained"
                    color="primary"
                    onClick={() => { reduceTime() }}>
                    Submit
                </Button>
            )}
            <Button
                disabled={disabled}
                variant="contained"
                color="default"
                onClick={() => { getRedoTime() }}>
                Redo
            </Button>
            <Button
                variant="contained"
                color="secondary"
                onClick={dialogOpen}>
                RESET ALL
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
