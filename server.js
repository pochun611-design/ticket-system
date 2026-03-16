const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();

// 1. 中間件設定
app.use(cors()); // 允許 Vercel 前端跨網域存取
app.use(express.json()); // 讓後端能解析 JSON 資料

// 2. 資料庫連線設定
// Railway 會自動提供 DATABASE_URL 環境變數，不建議把密碼直接寫在程式碼裡
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Railway 連線通常需要開啟 SSL
    }
});

// 3. 測試 API 是否運作 (打開網址首頁會看到這個)
app.get('/', (req, res) => {
    res.send('暴亂因子-金屬狂暴祭 後端伺服器運作中！');
});

// 4. 接收訂單的 API
app.post('/api/orders', async (req, res) => {
    const { name, phone, email, total } = req.body;

    // 基本檢查
    if (!name || !phone || !total) {
        return res.status(400).json({ success: false, message: '資料欄位不完整' });
    }

    try {
        // 將資料寫入資料庫
        const queryText = `
            INSERT INTO orders (name, phone, email, total, status)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, created_at
        `;
        const values = [name, phone, email, total, '待現場付款'];
        
        const result = await pool.query(queryText, values);
        
        console.log('新訂單已存入：', result.rows[0]);

        // 回傳成功訊息給前端
        res.status(201).json({
            success: true,
            message: '預約成功',
            order: result.rows[0]
        });

    } catch (err) {
        console.error('資料庫錯誤：', err.message);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤，無法儲存訂單'
        });
    }
});

// 5. 啟動伺服器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`伺服器正運行在埠號 ${PORT}`);
});