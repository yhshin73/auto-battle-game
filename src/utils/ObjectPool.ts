export class ObjectPool<T extends { active: boolean }> {
  private pool: T[] = [];
  private factory: () => T;

  constructor(factory: () => T, initialSize = 20) {
    this.factory = factory;
    for (let i = 0; i < initialSize; i++) {
      const obj = factory();
      obj.active = false;
      this.pool.push(obj);
    }
  }

  get(): T {
    const obj = this.pool.find(o => !o.active);
    if (obj) {
      obj.active = true;
      return obj;
    }
    const newObj = this.factory();
    newObj.active = true;
    this.pool.push(newObj);
    return newObj;
  }

  release(obj: T): void {
    obj.active = false;
  }

  getActiveCount(): number {
    return this.pool.filter(o => o.active).length;
  }
}
