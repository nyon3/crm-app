import React, { useState, useEffect } from 'react';
import 'firebase/firestore'
import firebase from 'firebase/app'
import initFirebase from '../utils/auth/initFirebase';
import dayjs from 'dayjs';

initFirebase()
const db = firebase.firestore();

const FirebaseStore = () => {
    const [users, setUsers] = useState([]);
    const [hour, setHour] = useState(0);
    const [minute, setMinute] = useState(0)
    const [name, setName] = useState('');
    const [fee, setFee] = useState('Have a nice day!');
    const [customer, setCustomer] = useState([])


    // the customer query.
    const docRef = db.collection('users')
    const query = docRef.where('name', '==', name);


    useEffect(() => {
        docRef.onSnapshot(async (snapshot) => {
            let userInfo = []
            await Promise.all(snapshot.docs.map(async (doc) => {
                let documentSnapshot = await docRef.get();
                console.log(documentSnapshot);
                userInfo.push({
                    userId: doc.id,
                    ...doc.data()
                })
            }))
            setCustomer(userInfo)
        })
    }, [])

    // TODO realtime calculation
    // const getFeildData = async () => {
    //     const snapshot = await db.collection('users').get();
    //     const _users = [];

    //     snapshot.forEach(doc => {
    //         _users.push({
    //             userId: doc.id,
    //             ...doc.data()
    //         });
    //     })
    //     setUsers(_users)
    // };

    const totalTime = (arrivedHour, arrivedMinute) => {
        // Current time.
        const dateFrom = dayjs();
        // End time.
        const dateTo = dayjs().hour(arrivedHour).minute(arrivedMinute);
        //   Calculate difference between start time and end time.
        const totalMinutes = dateFrom.diff(dateTo, 'minute');

        return <p>{totalMinutes}</p>
    }

    //  Submit customer's spending time on database.
    const setData = async () => {
        const check = (arrivedHour, arrivedMinute) => {
            return new Promise(res => {
                // Current time.
                const dateFrom = dayjs();
                // End time.
                const dateTo = dayjs().hour(arrivedHour).minute(arrivedMinute);
                //   Calculate difference between start time and end time.
                res(dateFrom.diff(dateTo, 'minute'))
                // Set calculated time in Count.
            })
        };
        await check(hour, minute).then(res => {
            query.get().then(snapshots => {
                snapshots.forEach(snapshot => {
                    console.log(snapshot.id, "=>", snapshot.data());
                    docRef.doc(snapshot.id).update({ spentTime: firebase.firestore.FieldValue.increment(res) })
                });
            }).then(() => console.log('updated')).catch((err) => console.log(err))
        })
    };

    // reset individual customer's spending time on database.
    const resetData = async () => {
        query.get().then(snapshots => {
            snapshots.forEach(snapshot => {
                console.log(snapshot.id, "=>", snapshot.data());
                docRef.doc(snapshot.id).update({ spentTime: 0 })
            });
        }).then(() => console.log('clear record')).catch((err) => console.log(err))
    };
    // reset all customer's spending time on database.
    const resetAll = async () => {
        docRef.get().then(querySnapshot => {
            querySnapshot.forEach(doc => {
                doc.ref.update({
                    spentTime: 0
                });
            });
        }).then(() => console.log('reset all data')).catch((err) => console.log(err))
    };

    // Calc Max and spentTime.
    async function calc() {
        let timeLimit = 0
        const charge = 250
        const totalTimeForMonth = []

        // 会員さんの今月使った時間とメンバーシップ情報を取得
        await query.get().then(snapshots => {
            snapshots.forEach(snapshot => {
                totalTimeForMonth.push(snapshot.data().spentTime);
                if (snapshot.data().membership === 'lite') {
                    console.log(snapshot.data().membership);
                    timeLimit = 300
                } else {
                    console.log(snapshot.data().membership);
                    timeLimit = 720
                }
            });
        }).then(() => console.log(timeLimit, totalTimeForMonth[0]));

        // 限界時間から今月使った時間を差し引いて、残り時間を計算する
        const resolveOverTime = (limit, used) => {
            return new Promise(resolve => {
                resolve(limit - used);
            });
        }
        //　超過料金の計算処理を実行
        await resolveOverTime(timeLimit, totalTimeForMonth[0]).then((res) => {
            if (res >= 0) {
                return setFee(`残り時間は ${res}分です`);
            } else if (res <= -1, res >= -15) {
                return setFee(`${res}分過ぎています。 料金は${charge}円です。`);
            } else if (res <= -16, res >= -30) {
                return setFee(`${res}分過ぎています。 料金は${charge * 2}円です。`);
            } else if (res <= -31, res >= -45) {
                return setFee(`${res}分過ぎています。 料金は${charge * 3}円です。`);
            } else if (res <= -46, res >= -60) {
                return setFee(`${res}分過ぎています。 料金は${charge * 4}円です。`);
            } else setFee(`${res}分の超過料金の計算をお願いします。`);
        })
    }

    // Create all user status. 
    const userList = users.map(user => {
        return (
            <li key={user.userId}>{user.name} : {user.spentTime} : {user.membership}</li>
        )
    })

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
    // Make user list
    const members = customer.map(user => {
        return (
            <option value={user.name}>{user.name}</option>
        )
    })


    // 　　　Create User interface.
    return (
        <>
            {/* <button onClick={getFeildData}>Field</button> */}
            <ul>{userList}</ul><br />
            {customer.map((e) => {
                return (
                    <li>{`${e.name} : ${e.spentTime} : ${e.membership}`}</li>
                )
            })}
            <select name="" id=""
                onChange={(e) => setName(e.target.value)}>
                <option value="Hour">USER</option>
                {members}
            </select>
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
            {totalTime(hour, minute)}
            <button onClick={() => { calc() }}>Calc</button>
            <button onClick={setData}>ADD</button>
            <button onClick={resetData}>clear</button>
            <button onClick={resetAll}>reset</button>
            <input type="text" value={fee} />
        </>
    )
}

export default FirebaseStore