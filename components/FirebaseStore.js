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


initFirebase()
const db = firebase.firestore();

const FirebaseStore = () => {
    const [setRealTimeUser, setRealTimeUserInfo] = useState([]);
    const [hour, setHour] = useState(0);
    const [minute, setMinute] = useState(0)
    const [name, setName] = useState('');
    const [dialog, setDialog] = useState(false);
    const [processing, setProcessing] = useState('');
    const [succeeded, setSucceeded] = useState(false);
    const [disabled, setDisabled] = useState(true)
    // the customer query.
    const docRef = db.collection('users')
    const query = docRef.where('name', '==', name);

    // アプリをあけたらカスタマー情報を更新する
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

    // Component for display spent time.
    const totalTime = (arrivedHour, arrivedMinute) => {
        // Current time.
        const dateFrom = dayjs();
        // End time.
        const dateTo = dayjs().hour(arrivedHour).minute(arrivedMinute);
        //   Calculate difference between start time and end time.
        const totalMinutes = dateFrom.diff(dateTo, 'minute');

        var hour = Math.floor(totalMinutes / 60);
        var min = totalMinutes % 60;

        if (totalMinutes < 0) {
            return <p>滞在時間がマイナスです</p>

        }
        return <p>{`${hour} : ${min}`}</p>
    }

    // reset all customer's spending time on database.　
    const resetAll = async () => {
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
        setDialog(false)
    };

    // Calc Max and spentTime.
    const calc = async () => {

        const charge = 250
        // const totalTimeForMonth = []

        setProcessing(true)

        // 入店時間と退店時間を比較して、トータル時間を計算
        const check = (arrivedHour, arrivedMinute) => {
            return new Promise(res => {
                // Current time.
                const dateFrom = dayjs();
                // End time.

                const dateTo = dayjs().hour(arrivedHour).minute(arrivedMinute);
                //   Calculate difference between start time and end time.
                const difference = dateFrom.diff(dateTo, 'minute');
                const result = difference * -1
                // TODO 四捨五入を導入！
                res(result)
                // Set calculated time in Count.
            })
        };
        // トータル時間をデータベースに送信する
        await check(hour, minute).then(res => {
            query.get().then(snapshots => {
                snapshots.forEach(snapshot => {
                    docRef.doc(snapshot.id).update({ spentTime: firebase.firestore.FieldValue.increment(res) })
                });
            }).then(() => {
                setSucceeded(true)
                setProcessing(false)
            }).catch((err) => console.log(err))
        })


        // //　超過料金の計算処理を実行
        // // TODO お客様を変更してボタンを押すと合計時間がバグっている
        // await resolveOverTime(timeLimit, totalTimeForMonth[0]).then((res) => {
        //     if (res >= 0) {
        //         return setFee(`残り時間は ${res}分です`);
        //     } else if (res <= -1, res >= -15) {
        //         return setFee(`${res}分過ぎています。 料金は${charge}円です。`);
        //     } else if (res <= -16, res >= -30) {
        //         return setFee(`${res}分過ぎています。 料金は${charge * 2}円です。`);
        //     } else if (res <= -31, res >= -45) {
        //         return setFee(`${res}分過ぎています。 料金は${charge * 3}円です。`);
        //     } else if (res <= -46, res >= -60) {
        //         return setFee(`${res}分過ぎています。 料金は${charge * 4}円です。`);
        //     } else setFee(`${res}分の超過料金の計算をお願いします。`);
        // })
    }

    // Make list for time.
    const list = (minute) => {
        const times = [...Array(minute)].map((i, index) => index + 1);
        return (
            times.map((m) => {
                return (
                    <option value={m} key={m}>{m}</option>
                )
            })
        )
    }
    // Make user list for option 
    const members = setRealTimeUser.map(user => {
        return (
            <option value={user.name}>{user.name}</option>
        )
    })

    // Display selected user status.
    const userInfo = setRealTimeUser.map(user => {
        function min2hour(time) {
            var hour = Math.floor(time / 60);
            var min = time % 60;

            return (`${hour} : ${min}`)
        }
        if (user.name == name) {
            return <p>{user.name} <strong> {min2hour(user.spentTime)}</strong></p>
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
    const handleClose = () => {
        setSucceeded(false)
    }

    // 　　　Create User interface.
    return (
        <>
            <ul>{userInfo}</ul>
            <select name="" id=""
                onChange={(e) => {
                    setName(e.target.value);
                    setDisabled(false)
                }}>
                <option value="Hour">Choose Customer</option>
                {members}
            </select>
            <br />
            <br />
            <select name="Hour" id=""
                onChange={(e) => setHour(e.target.value)}>
                <option value="Hour">HOUR</option>
                {list(24)}
            </select>
            <select name="Minute" id=""
                onChange={(e) => setMinute(e.target.value)}>
                <option value="Minute">MINUTE</option>
                {list(59)}
            </select>
            <br />
            <p>Total time is {totalTime(hour, minute)}</p>
            {processing ? (<CircularProgress />) : (
                <Button
                    disabled={disabled}
                    variant="contained"
                    color="primary"
                    onClick={() => { calc() }}>
                    Calc
                </Button>
            )}
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