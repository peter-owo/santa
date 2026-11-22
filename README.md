# 聖誕老公公許願池：GitHub Pages 版

這一份是可直接上傳到 GitHub Pages 的靜態網站。首頁、問答、文字、畫筆、橡皮擦、照片、角色貼紙、多頁卡片與下載功能都保留。寄送時會將所有頁面合成一張長圖附件，透過 FormSubmit 寄到 `peterchiu331hi@gmail.com`。附件通常是 PNG；圖片太大時會改用 JPEG。網站不儲存卡片，也沒有管理收件匣。

選取卡片上的項目後，可以按 Delete 刪除、Ctrl+C 複製、Ctrl+X 剪下、Ctrl+V 貼上。Ctrl+Z 是上一步；Ctrl+Y 或 Ctrl+Shift+Z 是下一步。正在文字框內打字時，這些快捷鍵會維持一般文字編輯的用途。

## 上傳與啟用

1. 在 GitHub 建立**公開** repository。GitHub Free 的 Pages 需要公開 repository。
2. 把這個資料夾內的 `index.html`、`app.js`、`style.css`、`thanks.html`、`.nojekyll` 和 `stickers` 資料夾上傳到 repository **根目錄**。`README.md` 可一併上傳。
3. 在 repository 的 **Settings → Pages**，選 **Deploy from a branch**，分支選 `main`，資料夾選 `/ (root)`，儲存。等 GitHub 顯示網站網址。
4. 用正式網址寄送一張測試卡片。若 FormSubmit 寄來啟用信，請用最新的啟用連結完成確認，然後再測一次。檢查收件信中是否有 `santa-card.png` 或 `santa-card.jpg` 圖片附件。

`index.html` 的表單 `action` 是收件地址；如果要改信箱，修改那一處即可。此網站將寄送附件限制在 4 MB。寄送後若信件未送達，網站沒有備份，所以可以先按「下載卡片」。

網站與程式碼會公開；`noindex` 只是告訴搜尋引擎不要收錄，無法阻止取得連結的人造訪或轉傳。表單會由 FormSubmit 處理，請勿在 repository 內放密碼或其他秘密。
