import React, { useState, useEffect } from 'react';
import 'firebase/firestore'
import firebase from 'firebase/app'
import initFirebase from '../utils/auth/initFirebase';
import dayjs from 'dayjs';
import { Button } from '@material-ui/core';

initFirebase()
const db = firebase.firestore();

const FirebaseStore = () => {
    const [setRealTimeUser, setRealTimeUserInfo] = useState([]);
    const [hour, setHour] = useState(0);
    const [minute, setMinute] = useState(0)
    const [name, setName] = useState('');
    const [fee, setFee] = useState('Have a nice day!');

    // 全顧客情報を取得するときのステート、必要なければ削除
    // const [customer, setCustomer] = useState([])


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

    // docRef.where('name', '==', name).onSnapshot(async (snapshot) => {
    //     let userInfo = []
    //     await Promise.all(snapshot.docs.map(async (doc) => {
    //         userInfo.push({
    //             userId: doc.id,
    //             ...doc.data()
    //         })
    //     }))
    //     setRealTimeUserInfo(userInfo)
    // })

    // 全顧客のリストを取得して表示する
    // const getFeildData = async () => {
    //     const snapshot = await db.collection('users').get();
    //     const _users = [];

    //     snapshot.forEach(doc => {
    //         _users.push({
    //             userId: doc.id,
    //             ...doc.data()
    //         });
    //     })
    //     setCustomer(_users)
    // };

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
    // TODO アラートを実装
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
        }).then(() => console.log('reset all data')).catch((err) => console.log(err))
    };

    // Calc Max and spentTime.
    const calc = async () => {
        // let timeLimit = 0
        const charge = 250
        // const totalTimeForMonth = []

        // 入店時間と退店時間を比較して、トータル時間を計算
        const check = (arrivedHour, arrivedMinute) => {
            return new Promise(res => {
                // Current time.
                const dateFrom = dayjs();
                // End time.
                // TODO 四捨五入を導入！
                const dateTo = dayjs().hour(arrivedHour).minute(arrivedMinute);
                //   Calculate difference between start time and end time.
                const difference = dateFrom.diff(dateTo, 'minute');
                const result = difference * -1
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
            }).then(() => console.log('updated')).catch((err) => console.log(err))
        })

        // // 会員さんの今月使った時間とメンバーシップ情報を取得
        // await query.get().then(snapshots => {
        //     snapshots.forEach(snapshot => {
        //         totalTimeForMonth.push(snapshot.data().spentTime);
        //         if (snapshot.data().membership === 'lite') {
        //             timeLimit = 300
        //         } else {
        //             timeLimit = 720
        //         }
        //     });
        // }).then(() => console.log(timeLimit, totalTimeForMonth[0]));

        // // 限界時間から今月使った時間を差し引いて、残り時間を計算する
        // const resolveOverTime = (limit, used) => {
        //     return new Promise(resolve => {
        //         resolve(limit - used);
        //     });
        // }
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


    // Create ALL user status. 全顧客情報を取得するボタンを実装しないなら削除
    // const allUserList = customer.map(user => {
    //     return (
    //         <li key={user.userId}>{user.name} : {user.spentTime} : {user.membership}</li>
    //     )
    // })

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

    // Create selected user status.
    const singleUser = setRealTimeUser.map(user => {
        if (user.name == name) {
            return <p>{user.name} : {user.spentTime}</p>
        }
    })


    // 　　　Create User interface.
    return (
        <>

            {/* <ul>{userList}</ul><br /> */}
            <ul>{singleUser}</ul>
            {/* <p>{fee}</p> */}
            <select name="" id=""
                onChange={(e) => setName(e.target.value)}>
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
            <Button variant="contained" color="primary" onClick={() => { calc() }}>Calc</Button>
            <Button variant="contained" color="secondary" onClick={resetAll}>RESET ALL</Button>
            {/* <button onClick={getFeildData}>Update ALL</button> */}
            <br />
            {/* <ul>{allUserList}</ul> */}
            <br />

        </>
    )
}

export default FirebaseStore