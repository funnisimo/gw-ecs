export interface Component<T extends Object> extends Function {
  new (...args: any[]): T;
}

export type AnyComponent = Component<any>;

export interface SimpleComponent<T extends Object> extends Function {
  new (): T;
}

export type AnySimpleComponent = SimpleComponent<any>;

// class Item {
//   kind: string;

//   constructor(kind: string) {
//     this.kind = kind;
//   }
// }

// function getItem<T>(comp: Component<T>): T {
//   console.log("component name = " + comp.name);
//   return new comp(comp.name);
// }

// console.log("constructor = " + Item.name);

// const item = getItem(Item);
// console.log("item = " + item.kind);
