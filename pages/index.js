import React from 'react';
import useSWR from 'swr'
import Link from 'next/link'
import { useUser } from '../utils/auth/useUser'
import FirebaseStore from '../components/FirebaseStore'

const fetcher = (url, token) =>
  fetch(url, {
    method: 'GET',
    headers: new Headers({ 'Content-Type': 'application/json', token }),
    credentials: 'same-origin',
  }).then((res) => res.json())

export async function getStaticProps() {
  const memberList = [
    { id: 1, name: 'Musashi' },
    { id: 2, name: 'Taro' },
  ]

  return {
    props: { memberList } // will be passed to the page component as props
  }
}
const Index = ({ memberList }) => {
  const { user, logout } = useUser()
  const { data, error } = useSWR(
    user ? ['/api/getFood', user.token] : null,
    fetcher
  )

  if (!user) {
    return (
      <>
        <p>Hi there!</p>
        <p>
          You are not signed in.{' '}
          <Link href={'/auth'}>
            <a>Sign in</a>
          </Link>
        </p>
      </>
    )
  }

  return (
    <div className="global-wrapper">
      <div>
        {/* <p>You're signed in. Email: {user.email}</p> */}
        <p
          style={{
            display: 'inline-block',
            color: 'blue',
            textDecoration: 'underline',
            cursor: 'pointer',
          }}
          onClick={() => logout()}
        >
          Log out
        </p>
      </div>
      {/* get date from backend */}
      {/* {error && <div>Failed to fetch food!</div>}
      {data && !error ? (
        <div>Your favorite food is {data.food}.</div>
      ) : (
          <div>Loading...</div>
        )} */}
      <FirebaseStore data={memberList} />
    </div>
  )
}

export default Index
