// Config para `npm run studio` (vista previa interactiva de los reels).
import { Config } from '@remotion/cli/config';

Config.setEntryPoint('./video/src/index.jsx');
Config.setPublicDir('./video/public');
Config.setVideoImageFormat('jpeg');
Config.setCodec('h264');
