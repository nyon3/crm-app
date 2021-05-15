export function createHourArray(num) {
    // 14から始まる配列を作成する
    // const numbers = [...Array(num)].map((i, index) => index + 14);
    const numbers = [...Array(num)].map((i, index) => index);
    return (
        numbers.map((number) => {
            return (
                <option value={number} key={number}>{number}</option>
            )
        })
    )
}

export function createMinuteArray(num) {
    // 0から始まる配列を作成する
    const numbers = [...Array(num)].map((i, index) => index);
    return (
        numbers.map((number) => {
            return (
                <option value={number} key={number}>{number}</option>
            )
        })
    )
}

