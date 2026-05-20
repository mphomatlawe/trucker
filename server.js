
const express = require('express')
const app = express()

app.get('/api/data', (req, res) => {
  res.json({ message: "Hello from backend" })
})

app.listen(5000, () => console.log("Server running on http://localhost:5000"))
