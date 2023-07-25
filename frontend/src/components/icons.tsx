import ArticleRoundedIcon from "@mui/icons-material/ArticleRounded";
import Co2RoundedIcon from "@mui/icons-material/Co2Rounded";
import EmojiNatureRoundedIcon from "@mui/icons-material/EmojiNatureRounded";
import GestureRoundedIcon from "@mui/icons-material/GestureRounded";
import LabelRoundedIcon from "@mui/icons-material/LabelRounded";
import SyncAltRoundedIcon from "@mui/icons-material/SyncAltRounded";

const icons = {
  get co2() {
    return <Co2RoundedIcon />;
  },
  get emojiNature() {
    return <EmojiNatureRoundedIcon />;
  },
  get emoji_nature() {
    return <EmojiNatureRoundedIcon />;
  },
  get syncAlt() {
    return <SyncAltRoundedIcon />;
  },
  get sync_alt() {
    return <SyncAltRoundedIcon />;
  },
  get gesture() {
    return <GestureRoundedIcon />;
  },
  get article() {
    return <ArticleRoundedIcon />;
  },
  get default() {
    return <LabelRoundedIcon />;
  },
};
export default icons;
