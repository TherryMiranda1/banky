import { TREASURY_KEY } from "./sprite-map";

export const SCENE_KEY = "PhaserRealmScene";

export interface RealmAssetConfig {
  key: string;
  path: string;
}

export const REALM_ASSET_KEYS: RealmAssetConfig[] = [
  { key: "ground", path: "/assets/ground.png" },
  { key: "ground_rocks", path: "/assets/ground-with-rocks.png" },
  { key: "tree", path: "/assets/tree.png" },
  { key: "rock", path: "/assets/rock.png" },
  { key: "water", path: "/assets/water.png" },
  { key: "debt", path: "/assets/debt.png" },
  { key: "food", path: "/assets/food.png" },
  { key: "healt", path: "/assets/healt.png" },
  { key: "home", path: "/assets/home.png" },
  { key: TREASURY_KEY, path: "/assets/incomes.png" },
  { key: "insurance", path: "/assets/insurance.png" },
  { key: "leisure", path: "/assets/leisure.png" },
  { key: "prince_character", path: "/assets/prince_character.png" },
  { key: "princess_character", path: "/assets/princess_character.png" },
  { key: "savings", path: "/assets/savings.png" },
  { key: "storehouse", path: "/assets/storehouse.png" },
  { key: "subscriptions", path: "/assets/subscriptions.png" },
  { key: "transport", path: "/assets/transport.png" },
  { key: "unexpected", path: "/assets/unexpected.png" }
];
