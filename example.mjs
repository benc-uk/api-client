// ----------------------------------------------------------------------------
// Copyright (c) Ben Coleman, 2023. Licensed under the MIT License.
// Example usage of the base API client, that calls https://fruityvice.com/
// ----------------------------------------------------------------------------

import { APIClientBase } from "./lib/api-client-base.mjs";

export class FruitAPI extends APIClientBase {
  constructor() {
    super("https://www.fruityvice.com/api/");
  }

  async getAllFruit() {
    return this._request("fruit/all");
  }

  async getFruit(name) {
    return this._request(`fruit/${name}`);
  }

  async getAllVegetables() {
    return this._request(`vegetables`);
  }
}

async function main() {
  const fruitAPI = new FruitAPI();

  console.log("\n### Getting all fruit");
  const fruits = await fruitAPI.getAllFruit();
  for (const fruit of fruits) {
    console.log(fruit.name);
  }

  console.log("\n### Getting a single fruit");
  const fruit = await fruitAPI.getFruit("apple");
  console.log(fruit);

  try {
    console.log("\n### Getting all vegetables");
    const veggies = await fruitAPI.getVegetables();
    console.log(veggies);
  } catch (e) {
    console.error("Failed to get vegetables!", e.message);
  }
}

main();
