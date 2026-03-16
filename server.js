const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();

// 1. 中間件設定
// 允許所有來源連線，確保 Vercel 前端能順利存取
app.use(cors()); 
app.use(express.json()); 

// 2. 資料庫連線設定 (優化後的 SSL 邏輯)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // 自動判斷：如果是 Railway 內部連線則不強制 SSL，如果是外部公網連線則開啟
    ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('railway.internal')
        ? false
        : { rejectUnauthorized: false }
});

// 測試資料庫連線狀況
pool.connect((err, client, release) => {
    if (err) {
        return console.error('❌ 資料庫連線失敗：', err.stack);
    }
    console.log('✅ 資料庫連線成功！');
    release();
});

// 3. 測試 API 是否運作
app.get('/', (req, res) => {
    res.send('🤘 暴亂因子-金屬狂暴祭 後端伺服器運作中！');
});

// 4. 接收訂單的 API
app.post('/api/orders', async (req, res) => {
    const { name, phone, email, total } = req.body;

    // 基本欄位檢查
    if (!name || !phone || total === undefined) {
        return res.status(400).json({ 
            success: false, 
            message: '資料欄位不完整，請確保填寫了姓名、電話與票價。' 
        });
    }

    try {
        // 將資料寫入資料庫
        const queryText = `
            INSERT INTO orders (name, phone, email, total, status)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, created_at
        `;
        const values = [name, phone, email || '', total, '待現場付款'];
        
        const result = await pool.query(queryText, values);
        
        console.log('✨ 新訂單已存入：', result.rows[0]);

        // 回傳成功訊息給前端
        res.status(201).json({
            success: true,
            message: '預約成功',
            order: result.rows[0]
        });

    } catch (err) {
        console.error('❌ 資料庫寫入錯誤：', err.message);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤，請檢查資料表 orders 是否已建立。'
        });
    }
});

// 5. 啟動伺服器
// Railway 會動態分配 PORT，若無則預設為 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🔥 Metal Frenzy Backend is running on port ${PORT}`);
});