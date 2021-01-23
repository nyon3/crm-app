import React from 'react';
import 'firebase/firestore'
import firebase from 'firebase/app'
import initFirebase from '../../utils/auth/initFirebase';

initFirebase()
const db = firebase.firestore();
const docRef = db.collection('users')

function GetUserInfo(time, rank, name) {
    return <p>{`${time}: ${name}`}</p>
}
export async function getStaticProps() {
    const _customer = []
    docRef.doc("Rn8BAQuVBSOvacIiJEFD").onSnapshot(doc => {
        console.log(doc.data().membership);
        const time = doc.data().spentTime;
        const rank = doc.data().membership;
        const name = doc.data().name;
        _customer.push(time, rank, name)
        console.log(_customer);
    })
    return {
        props: {
            time: _customer.time,
            rank: _customer.rank,
            name: _customer.name,
        }
    };
}

export default GetUserInfo
