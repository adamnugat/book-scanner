import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { healthRouter } from './routes/health';
import { authRouter } from './routes/auth';
import { projectsRouter } from './routes/projects';
import { imagesRouter } from './routes/images';
import { scenesRouter } from './routes/scenes';
import { voicesRouter } from './routes/voices';
import { interstitialPresetsRouter } from './routes/interstitial-presets';
import { audioRouter } from './routes/audio';
import { ocrRouter } from './routes/ocr';
import { playlistRouter } from './routes/playlist';
import { sharingRouter } from './routes/sharing';
import { pricingRouter } from './routes/pricing';
import { globalErrorHandler } from './middleware/error-handler';
import { apiLimiter, authLimiter } from './middleware/rate-limit';

export const app = express();

app.use(helmet());
app.use(cors());
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
  app.use(apiLimiter);
}
app.use(express.json());

app.use('/health', healthRouter);
app.use('/auth', authLimiter, authRouter);
app.use('/projects/:projectId/images', imagesRouter);
app.use('/projects/:projectId', audioRouter);
app.use('/projects/:projectId', ocrRouter);
app.use('/projects', projectsRouter);
app.use('/projects/:projectId/scenes', scenesRouter);
app.use('/voices', voicesRouter);
app.use('/interstitial-presets', interstitialPresetsRouter);
app.use('/projects/:projectId', playlistRouter);
app.use('/projects/:projectId', sharingRouter);
app.use('/', pricingRouter);

app.use(globalErrorHandler);
