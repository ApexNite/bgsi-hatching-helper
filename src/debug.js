// @ts-nocheck
import { get } from "svelte/store";
import { dataStore, isDataLoaded, dataError } from "./lib/dataStore.js";
import { setCookie, getCookie, deleteCookie } from "./lib/cookieUtils.js";

let flags = {};

export function getProjectHash() {
  console.log(__PROJECT_HASH__);
}

export function getSourceHash() {
  console.log(__BUILD_HASH__);
}

export function getDataHash() {
  if (!canReadData()) {
    console.log("Failed to read data");
  }

  const data = get(dataStore);
  console.log(data?.dataHash || "Failed to read data");
}

export function getBuildDate() {
  console.log(__BUILD_DATE__);
}

export function setFlag(flag) {
  flags = getCookie("hatching-helper-debug-flags") || {};
  flags[flag] = true;
  setCookie("hatching-helper-debug-flags", flags);
}

export function unsetFlag(flag) {
  flags = getCookie("hatching-helper-debug-flags") || {};
  flags[flag] = false;
  setCookie("hatching-helper-debug-flags", flags);
}

export function getFlag(flag) {
  flags = getCookie("hatching-helper-debug-flags") || {};
  return Object.prototype.hasOwnProperty.call(flags, flag) ? flags[flag] : null;
}

export function clearSettings() {
  deleteCookie("hatching-helper-user-input");
  deleteCookie("hatching-helper-pet-table-settings");
  deleteCookie("hatching-helper-debug-flags");

  window.location.reload();
}

function canReadData() {
  return !get(dataError) && get(isDataLoaded);
}

if (typeof window !== "undefined") {
  window.debug = {
    getBuildDate,
    getSourceHash,
    getDataHash,
    getProjectHash,
    setFlag,
    unsetFlag,
    getFlag,
    clearSettings,
  };
}
