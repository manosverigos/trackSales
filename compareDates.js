exports.dayDiff = (date1, date2) => {
  //yyyy-mm-dd
  const _d1 = date1.split('-')
  let d1 = [];
  let d2 = [];

  for (num of _d1){
    d1.push(parseInt(num))
  }
  const _d2 = date2.split('-')
  for (num of _d2){
    d2.push(parseInt(num))
  }
  let dayDiff = 0;

  dayDiff += (d1[0]-d2[0])*365
  dayDiff += (d1[1]-d2[1])*30
  dayDiff += (d1[2]-d2[2])

  return dayDiff


  // if (d1[0] > d2[0]) {
  //   return true
  // }else if (d1[0]< d2[0]){
  //   return false
  // }else{
  //   if (d1[1] > d2[1]){
  //     return true
  //   } else if (d1[1] < d2[1]){
  //     return false
  //   }else {
  //     if(d1[2]> d2[2]){
  //       return true
  //     }else{
  //       return false
  //     }
  //   }
  // }
}
