/*function saveLead(){
    alert("Clicked through onclick!")
}
let myLead=[];
const inputEl=document.getElementById("input-el");
const inputBtn=document.getElementById("input-btn");
const ulList=document.getElementById("ul-el");

inputBtn.addEventListener("click", function(){
   myLead.push(inputEl.value);
   inputEl.value="";
   renderLeads();
   //for renderLead( ) use the inputEl.value=""; here!
   
});

function renderLead(){
let listItem="<li>" + inputEl.value + "</li>"

//for(let i=0;i<myLead.length;i++){
    //ulList.innerHTML+="<li>" + myLead[i] + "</li>";
    //Three things are happening in it

    //1.)Create element
    //2.)set text content
    //3.)appent to unordered list
   /* const li=document.createElement("li");
    li.textContent+=myLead[i];
    ulList.append(li);*/
    //listItems+="<li>" + myLead[i] + "</li>";
//}
/*(ulList.innerHTML +=listItem;

}

function renderLeads{
    let listItems="";
    for(let i=0;i<myLead.length;i++){
      //  listItems+="<li> <a target ='_blank' href='" + myLead[i] + "'>" + myLead[i] + "</a></li>";
    listItems+=`<li>
    <a target='_blank' href='${myLead[i]}'>
    ${myLead[i]}
    </a>
    </li>
    `
    }
    ulList.innerHTML=listItems;
}*/

// script.js - robust version
let myLead = [];
const inputEl = document.getElementById("input-el");
const inputBtn = document.getElementById("input-btn");
const ulList = document.getElementById("ul-el");
const deleteBtn = document.getElementById("delete-btn");
const tabBtn = document.getElementById("tab-btn");

// load from storage
const leadFromLocalStorage = JSON.parse(localStorage.getItem("myLead"));
if (leadFromLocalStorage && Array.isArray(leadFromLocalStorage)) {
  myLead = leadFromLocalStorage;
  renderLeads();
}

// utility: get tabs with a promise, supports chrome & browser
function queryActiveTab() {
  const queryInfo = { active: true, currentWindow: true };

  // prefer browser.* (Promise) if available
  if (typeof browser !== "undefined" && browser.tabs && browser.tabs.query) {
    return browser.tabs.query(queryInfo);
  }

  // fallback to chrome.* callback wrapped in Promise
  if (typeof chrome !== "undefined" && chrome.tabs && chrome.tabs.query) {
    return new Promise((resolve, reject) => {
      try {
        chrome.tabs.query(queryInfo, (tabs) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(tabs);
          }
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  return Promise.reject(new Error("Tabs API not available in this environment"));
}

// Ask for "tabs" permission if it's not granted (optional_permissions flow)
async function ensureTabsPermission() {
  if (typeof chrome === "undefined" || !chrome.permissions || !chrome.permissions.contains) {
    // cannot check/request; assume permission is present or manifest contains tabs
    return true;
  }

  return new Promise((resolve) => {
    chrome.permissions.contains({ permissions: ["tabs"] }, (has) => {
      if (has) return resolve(true);

      // request permission (this will prompt the user)
      chrome.permissions.request({ permissions: ["tabs"] }, (granted) => {
        resolve(Boolean(granted));
      });
    });
  });
}

// click handler for SAVE TAB
tabBtn.addEventListener("click", async function () {
  try {
    const hasPermission = await ensureTabsPermission();
    if (!hasPermission) {
      console.warn("Tabs permission not granted by user.");
      alert("Permission required to save current tab. Please allow the permission.");
      return;
    }

    const tabs = await queryActiveTab();
    const url = tabs?.[0]?.url;

    // Many internal pages like chrome://, brave://, extension pages or file:// may be restricted.
    if (!url || url.startsWith("chrome://") || url.startsWith("brave://") || url.startsWith("about:") || url.startsWith("edge://") || url.startsWith("file://")) {
      console.warn("Active tab has no accessible URL or is a restricted page:", url);
      alert("Cannot save this tab (internal or restricted page). Try a normal website page.");
      return;
    }

    myLead.push(url);
    localStorage.setItem("myLead", JSON.stringify(myLead));
    renderLeads();
  } catch (err) {
    console.error("Error getting active tab:", err);
    alert("Could not get active tab. See console for details.");
  }
});

// Render the leads array into the UL (uses global myLead)
function renderLeads() {
  let listItems = "";
  for (let i = 0; i < myLead.length; i++) {
    const safeUrl = myLead[i];
    // optional: show only hostname instead of full URL for privacy: new URL(safeUrl).hostname
    listItems += `
      <li>
        <a target="_blank" rel="noopener noreferrer" href="${safeUrl}">
          ${safeUrl}
        </a>
        <button data-index="${i}" class="delete-item" title="Delete">✕</button>
      </li>`;
  }
  ulList.innerHTML = listItems;

  // wire up per-item delete buttons
  const delBtns = document.querySelectorAll(".delete-item");
  delBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      const idx = Number(this.dataset.index);
      if (!Number.isNaN(idx)) {
        myLead.splice(idx, 1);
        localStorage.setItem("myLead", JSON.stringify(myLead));
        renderLeads();
      }
    });
  });
}

// delete all (dblclick)
deleteBtn.addEventListener("dblclick", function () {
  localStorage.removeItem("myLead");
  myLead = [];
  renderLeads();
});

// save input
inputBtn.addEventListener("click", function () {
  const value = (inputEl.value || "").trim();
  if (value === "") return;
  myLead.push(value);
  inputEl.value = "";
  localStorage.setItem("myLead", JSON.stringify(myLead));
  renderLeads();
});

// initial render
renderLeads();