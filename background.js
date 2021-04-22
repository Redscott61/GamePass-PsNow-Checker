try {
  chrome.webNavigation.onDOMContentLoaded.addListener(
    function (details) {
      let url = details.url;

      const preUrl = "https://store.steampowered.com/app/";
      //make sure current address matches preUrl
      if (url.substring(0, preUrl.length) != preUrl) return;

      let gameName = url.substring(preUrl.length, url.length).split("/")[1];
      if (gameName.length < 1) return;

      let gameNameSpaced = "";
      for (var i = 0; i < gameName.length; i++) {
        if (gameName[i] == "_") {
          gameNameSpaced += " ";
        } else {
          gameNameSpaced += gameName[i];
        }
      }

      //replace underscores with query suitable escape characters
      while (true) {
        let gameNameNew = gameName.replace("_", "%20");
        if (gameNameNew == gameName) {
          gameName = gameNameNew;
          break;
        }
        gameName = gameNameNew;
      }

      //get current gamepass and psnow data and pass it to the content script
      fetch(
        "https://www.microsoft.com/en-us/search/shop/Games?q=" + gameName
      ).then((res) => {
        res.text().then((text) => {
          chrome.tabs.sendMessage(
            details.tabId,
            { source: "gamepass", data: text, trgt: gameNameSpaced },
            function (response) {}
          );

          fetch(
            "https://www.playstation.com/en-us/ps-now/ps-now-games/#all-ps-now-games"
          ).then((res) => {
            res.text().then((text) => {
              chrome.tabs.sendMessage(
                details.tabId,
                { source: "psnow", data: text, trgt: gameNameSpaced },
                function (response) {}
              );
            });
          });
        });
      });
    },
    {
      url: [
        {
          hostContains: "store.steampowered.",
        },
      ],
    }
  );
} catch (e) {
  console.error(e);
}
