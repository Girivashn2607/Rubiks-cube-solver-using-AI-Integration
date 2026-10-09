declare class Cube {
  constructor();
  static initSolver(): void;
  static fromString(str: string): Cube;
  isSolved(): boolean;
  move(alg: string): void;
  solve(maxDepth?: number): string;
  asString(): string;
  clone(): Cube;
}

export { Cube };
export default Cube;
