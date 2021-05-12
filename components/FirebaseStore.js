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
    // Todo 状態管理が多すぎるのでなんとかできないか？
    const [realTimeUserInfo, setRealTimeUserInfo] = useState([]);
    const [hour, setHour] = useState(0);
    const [minute, setMinute] = useState(0)
    const [name, setName] = useState('');
    const [dialog, setDialog] = useState(false);
    const [processing, setProcessing] = useState('');
    const [succeeded, setSucceeded] = useState(false);
    const [disabled, setDisabled] = useState(true)
    const [isLoaded, setisLoaded] = useState(false)
    // firestore customer query.
    const docRef = db.collection('users')
    const query = docRef.where('name', '==', name);

    // Today's date.
    const dateFrom = dayjs();
    const dateTo = dayjs().hour(hour).minute(minute);

    // // アプリをあけたらカスタマー情報を更新する 
    // // TODO:>  1. 名前とIDだけのデータ。　2.選ばれた人の全データ
    // useEffect(() => {
    //     docRef.onSnapshot(async (snapshot) => {
    //         let userInfo = []
    //         await Promise.all(snapshot.docs.map(async (doc) => {
    //             userInfo.push({
    //                 userId: doc.id,
    //                 userName: doc.data().name
    //             })
    //         }))
    //         setRealTimeUserInfo(userInfo)
    //     })
    // }, [])

    // // Make user list for option 
    // const members = setRealTimeUser.map(user => {
    //     return (
    //         <option value={user.userName} key={user.userId}>{user.userName}</option>
    //     )
    // })

    // reset all customer's spending time on database.　
    // TODO delete array
    function resetAll() {
        docRef.get().then(querySnapshot => {
            querySnapshot.forEach(doc => {
                // if (doc.data().membership == 'lite') {
                //     doc.ref.update({
                //         spentTime: 300
                //     });
                // } else {
                //     doc.ref.update({
                //         spentTime: 720
                //     });
                // }
                doc.ref.update({ history: firebase.firestore.FieldValue.arrayRemove(history[0]) })
            });
        }).then(() => console.log('reset all data')).catch((err) => console.log(err));
        setDialog(false);
    }

    // 入店時間と退店時間を比較して、トータル時間を計算
    function countTime(hour, minute) {
        //   Calculate difference between start time and end time.
        const difference = dateFrom.diff(dateTo, 'minute');

        // the number of the time deference.
        return new Promise(res => {
            res(Math.ceil(difference % 60 / 15) * 15 - (difference % 60) + difference)
        })
    }

    const sendDate = (hours) => {
        // Timestamp date for Today.
        const time = firebase.firestore.Timestamp.fromDate(new Date("November 8, 1815"))

        //  login: firebase.firestore.FieldValue.arrayUnion(time) *insert this code to update() 
        // Update each Field.
        query.get().then(snapshots => {
            snapshots.forEach(snapshot => {
                docRef.doc(snapshot.id).update({ history: firebase.firestore.FieldValue.arrayUnion(hours) });
            });
        }).then(() => {
            setTimeout(() => {
                setSucceeded(true)
                setProcessing(false)
            }, 3000);
        }).catch((err) => console.log(err));
    }

    //  TODO: FIX this function Redo function.
    const increaseTime = async () => {
        setProcessing(true)
        // TODO Ommit this valu to React Hooks (reducer)
        // const submitHours = await countTime(hour, minute);
        sendDate()
    }

    // Send a reduce time to firestore.
    const reduceTime = async () => {
        setProcessing(true)
        // TODO Ommit this valu to React Hooks (reducer)
        const submitHours = await countTime(hour, minute);
        // トータル時間をデータベースに送信する
        sendDate(submitHours)
    }


    // TODO　カスタマーを選んだら、すぐに情報が反映されるコンポーネントを作成する
   const timeManager = (data) => {
        
        // get total number from history array.
        if (isLoaded) { 
            const result = data.history
            let total = result.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
            return <p>{`残り時間は ${min2hour(data.spentTime - total)}`}</p>
        } else{ return <p>N/a!</p> }
            
}
 // Chage format of time.
    function min2hour(time) {
        var hour = Math.floor(time / 60);
        var min = time % 60;

        return (`${hour} : ${min}`)
    }

    // TODO create new useInfo component
      async function getUserInfo(name) {
          docRef.where('name', '==', name).get().then(snapshot => {
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

    // async function userParameter(value) {
    //     try {
    //         const currentUser = await getUserInfo(value)
    //         const result = currentUser.history
    //         let total = result.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
    //         return <p>{`${user.name} 様の`} <strong> {`残り時間は ${min2hour(user.spentTime - total)}`}</strong></p>

    //     } catch (error) {
    //         console.log("ERROR:", error);
    //     }
    // }

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
            <h2>{realTimeUserInfo.name}様　本日の滞在時間は…</h2>
            <select name="" id=""
                onChange={(e) => {
                    getUserInfo(e.target.value);
                    setDisabled(false)
                }}>
                <option value="Hour">Guest</option>
                {data.map(user => <option value={user.name} key={user.id}>{user.name}</option>)}
            </select>
            <p>Customer info: </p>
            {timeManager(realTimeUserInfo)}
            <h2>来店時間は</h2>
            <select name="Hour" id=""
                onChange={(e) => setHour(e.target.value)}>
                <option value="Hour">Hour</option>
                {createHourArray(24)}
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
                    onClick={() => { increaseTime() }}>
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

