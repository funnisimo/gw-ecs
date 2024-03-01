export interface Component<T> extends Function {
  new (...args: any[]): T;
}

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
