chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  const htmlParser = new DOMParser();

  const DOMObj = htmlParser.parseFromString(msg.data, "text/html");

  //returns whether or not two game titles are the same while ignoring punctiation marks
  function compareGameTitles(a, b) {
    //replaces punctiation marks with spaces and returns as a new string
    function getStringWithoutPunctiation(text) {
      let res = "";
      const punctiationChars = [
        "/",
        ":",
        ".",
        ",",
        "-",
        " ",
        "'",
        '"',
        "[",
        "]",
        "(",
        ")",
        "!",
        ";",
        "_",
        "?",
        "!",
        "\\",
        "^",
        "$",
        "+",
      ];
      for (var i = 0; i < text.length; i++) {
        punctiationChars.includes(text[i]) ? (res += "") : (res += text[i]);
      }
      return res;
    }

    //get rid of punctiation marks before comparing because publishers cant decide if its "half life" or "half-life"
    return getStringWithoutPunctiation(a) == getStringWithoutPunctiation(b);
  }

  function createAlertBox(text, color, link) {
    //find the panel steam uses to place purchase buttons on
    const purchaseArea = document.getElementById("game_area_purchase");

    const linkElement = document.createElement("A");
    linkElement.href = link;

    const alertDiv = document.createElement("DIV");
    alertDiv.style.paddingBottom = "16px";
    alertDiv.style.backgroundColor = color;
    alertDiv.style.paddingLeft = "26px";
    alertDiv.style.paddingTop = "16px";
    alertDiv.style.marginBottom = "18px";
    alertDiv.style.borderRadius = "3px";

    const alertLabel = document.createElement("H1");
    alertLabel.innerHTML = text;
    alertLabel.style.font = "21px 'Motiva Sans'";
    alertLabel.style.color = "#FFFFFF";

    alertDiv.appendChild(alertLabel);

    linkElement.appendChild(alertDiv);

    purchaseArea.insertBefore(linkElement, purchaseArea.firstChild);
  }

  switch (msg.source) {
    case "gamepass":
      //bunch of web scraping here
      const searchResults = DOMObj.getElementsByClassName(
        "m-channel-placement-item"
      );

      let isFoundInGamePass = false;

      console.log(
        "[GP/PN-Checker]" + "Searching for " + msg.trgt + " in xbox store"
      );

      for (var i = 0; i < searchResults.length; i++) {
        const title = searchResults[i].getElementsByClassName(
          "c-subheading-6"
        )[0].innerHTML;
        if (compareGameTitles(title, msg.trgt)) {
          console.log(
            title + " found in xboxstore. Checking for gamepass status."
          );
          if (
            searchResults[i].getElementsByClassName("glyph-xbox-gamepass")
              .length > 0
          ) {
            console.log(
              "[GP/PN-Checker]" + title + " is available on gamepass"
            );

            let link = searchResults[i].getElementsByTagName("A")[0].href;

            //DOMParser adds current host to relative links, so we replace it with the target host here
            const stringToRemove = "https://store.steampowered.com";
            link =
              "https://www.microsoft.com/" +
              link.substring(stringToRemove.length, link.length);

            const linkElement = createAlertBox(
              title + " is available on XBOX GamePass",
              "#107C10",
              link
            );

            isFoundInGamePass = true;
          }
          break;
        }
      }

      if (!isFoundInGamePass) {
        console.log(
          "[GP/PN-Checker]" + msg.trgt + " is not found in xbox store"
        );
      }
      break;
    case "psnow":
      let isFoundInPsNow = false;

      console.log(
        "[GP/PN-Checker]" + "Searching for " + msg.trgt + " in psnow"
      );

      //PsNow game list page contains severals divs that contain the data we want
      //so loop through them till we find the game we are looking for

      let tableIndex = 1;
      while (true) {
        let table = DOMObj.getElementById(
          "tab-content-" + tableIndex.toString()
        );
        if (table) {
          tableIndex += 1;

          let entries = table.getElementsByTagName("p");

          for (var i = 0; i < entries.length; i++) {
            if (compareGameTitles(entries[i].innerHTML, msg.trgt)) {
              console.log(
                "[GP/PN-Checker]" +
                  entries[i].innerHTML +
                  " is available on psnow"
              );

              //the page we are scraping does not provide direct links to the product page,
              //so just redirect user to a search page on psstore
              const linkElement = createAlertBox(
                entries[i].innerHTML + " is available on PSNow",
                "#0072CE",
                "https://www.playstation.com/en-us/search/?category=games&q=" +
                  entries[i].innerHTML
              );

              isFoundInPsNow = true;
              break;
            }
          }
        } else {
          break;
        }
      }

      if (!isFoundInPsNow) {
        console.log("[GP/PN-Checker]" + msg.trgt + " is not found in psnow");
      }
      break;
  }
});
