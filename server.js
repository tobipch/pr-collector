import express from 'express';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use('/data', express.static('data'));

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
