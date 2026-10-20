import express from 'express';
import { usuarioRouter } from './router/usuario.router';

const app = express();

app.use(express.json());


app.use('/usuario', usuarioRouter);

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});