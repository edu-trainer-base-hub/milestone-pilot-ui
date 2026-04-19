import { useEffect, useState } from "react";
import WebApp from "@twa-dev/sdk";

export function useTelegramHeader() {
  const [renderHeaderBlock, setRenderHeaderBlock] = useState<boolean>(false);

  useEffect(() => {
    if (WebApp) {
      WebApp.ready();
      if (WebApp.initDataUnsafe && Object.keys(WebApp.initDataUnsafe).length > 0) {
        setRenderHeaderBlock(WebApp.isFullscreen);
        console.log("Telegram WebApp is available: ", WebApp);
        console.log("Telegram WebApp initDataUnsafe: ", WebApp.initDataUnsafe);
      } else {
        console.warn("Telegram WebApp is not available");
      }
    }
  }, []);

  return { renderHeaderBlock };
}
