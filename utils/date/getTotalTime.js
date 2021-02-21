import dayjs from 'dayjs';

export const getTotalTime = (arrivedHour, arrivedMinute) => {
    // Current time.
    const dateFrom = dayjs();
    // End time.
    const dateTo = dayjs().hour(arrivedHour).minute(arrivedMinute);
    //   Calculate difference between start time and end time.
    const totalMinutes = dateFrom.diff(dateTo, 'minute');

    const hour = dateFrom.diff(dateTo, 'hour');
    const min = Math.ceil(dateFrom.diff(dateTo, 'minutes') % 60 / 15) * 15

    if (totalMinutes < 0) {
        return 滞在時間がマイナスです

    } else if (min === 60) {
        return <p>{`${hour + 1} : ${0}`}</p>
    }
    return <p>{`${hour} : ${min}`}</p>
}
