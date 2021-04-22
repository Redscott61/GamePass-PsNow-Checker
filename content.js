chrome.extension.onMessage.addListener(function (msg, sender, sendResponse) {
  const htmlParser = new DOMParser();

  const DOMObj = htmlParser.parseFromString(msg.data, "text/html");

  //copy pasted from stackoverflow
  function editDistance(s1, s2) {
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();

    var costs = new Array();
    for (var i = 0; i <= s1.length; i++) {
      var lastValue = i;
      for (var j = 0; j <= s2.length; j++) {
        if (i == 0) costs[j] = j;
        else {
          if (j > 0) {
            var newValue = costs[j - 1];
            if (s1.charAt(i - 1) != s2.charAt(j - 1))
              newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
            costs[j - 1] = lastValue;
            lastValue = newValue;
          }
        }
      }
      if (i > 0) costs[s2.length] = lastValue;
    }
    return costs[s2.length];
  }

  function similarity(s1, s2) {
    var longer = s1;
    var shorter = s2;
    if (s1.length < s2.length) {
      longer = s2;
      shorter = s1;
    }
    var longerLength = longer.length;
    if (longerLength == 0) {
      return 1.0;
    }
    return (
      (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength)
    );
  }

  function createAlertBox(text, color, link) {
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
    return linkElement;
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

        if (similarity(title, msg.trgt) > 0.75) {
          if (
            searchResults[i].getElementsByClassName("glyph-xbox-gamepass")
              .length > 0
          ) {
            console.log(
              "[GP/PN-Checker]" + msg.trgt + "is available on gamepass"
            );

            let link = searchResults[i].getElementsByTagName("A")[0].href;

            //DOMParser adds current host to relative links, so we replace it with the target host here
            const stringToRemove = "https://store.steampowered.com";
            link =
              "https://www.microsoft.com/" +
              link.substring(stringToRemove.length, link.length);

            const purchaseArea = document.getElementById("game_area_purchase");

            const linkElement = createAlertBox(
              msg.trgt + " is available on XBOX GamePass",
              "#107C10",
              link
            );

            purchaseArea.insertBefore(linkElement, purchaseArea.firstChild);

            isFoundInGamePass = true;
          }
          break;
        }
      }

      if (!isFoundInGamePass) {
        console.log("[GP/PN-Checker]" + msg.trgt + " is not found in gamePass");
      }
      break;
    case "psnow":
      let isFoundInPsNow = false;

      console.log(
        "[GP/PN-Checker]" + "Searching for " + msg.trgt + " in psnow"
      );
      let tableIndex = 1;
      while (true) {
        let table = DOMObj.getElementById(
          "tab-content-" + tableIndex.toString()
        );
        if (table) {
          tableIndex += 1;

          let entries = table.getElementsByTagName("p");

          for (var i = 0; i < entries.length; i++) {
            if (similarity(entries[i].innerHTML, msg.trgt) > 0.75) {
              console.log(
                "[GP/PN-Checker]" + msg.trgt + "is available on psnow"
              );

              const purchaseArea = document.getElementById(
                "game_area_purchase"
              );

              const linkElement = createAlertBox(
                msg.trgt + " is available on PSNow",
                "#0072CE",
                "https://www.playstation.com/en-us/search/?category=games&q=" +
                  msg.trgt
              );
              purchaseArea.insertBefore(linkElement, purchaseArea.firstChild);

              isFoundInPsNow = true;
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
