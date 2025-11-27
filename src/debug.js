// @ts-nocheck
import { get } from "svelte/store";
import { dataStore, isDataLoaded, dataError } from "./lib/dataStore.js";

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

function canReadData() {
  return !get(dataError) && get(isDataLoaded);
}

if (typeof window !== "undefined") {
  window.debug = {
    getBuildDate,
    getSourceHash,
    getDataHash,
    getProjectHash,
  };
}
