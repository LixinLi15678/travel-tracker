/**
 * countries.js
 * 动态获取全球国家列表并插入 <datalist> #countryList
 */
document.addEventListener('DOMContentLoaded', () => {
    const datalistEl = document.getElementById('countryList');
    if (!datalistEl) return;
  
    // 使用 Rest Countries API 获取世界国家
    // https://restcountries.com/
    fetch('https://restcountries.com/v3.1/all?fields=name')
      .then(res => res.json())
      .then(data => {
        data.forEach(countryObj => {
          // countryObj.name.common 是常用国名
          if (countryObj && countryObj.name && countryObj.name.common) {
            const option = document.createElement('option');
            option.value = countryObj.name.common;
            datalistEl.appendChild(option);
          }
        });
      })
      .catch(err => {
        console.error("获取国家列表失败：", err);
      });
  });
  