import express from 'express';
import cors from 'cors';
import { usuarioRouter } from './router/usuario.router';
import { gastosRouter } from './router/gastos.router';
import { pagamentoRouter } from './router/pagamento.router';
import { cartaoRouter } from './router/cartao.router';

const app = express();

// Configuração do CORS
app.use(cors({
  origin: '*', // Em produção, restrinja para o domínio do seu frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true
}));

app.use(express.json());


app.use('/usuario', usuarioRouter);
app.use('/gastos', gastosRouter);
app.use('/pagamento', pagamentoRouter);
app.use('/cartao', cartaoRouter);

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});