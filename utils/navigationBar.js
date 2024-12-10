
export const setNavigationBarTitle = (title) => {
  return new Promise((resolve, reject) => {
    uni.setNavigationBarTitle({
      title,
      success: () => {
        console.log('标题修改成功:', title);
        resolve();
      },
      fail: (err) => {
        console.error('标题修改失败:', err);
        reject(err);
      }
    });
  });
};
