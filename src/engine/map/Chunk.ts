import { Entity } from '../entity/Entity';
import { Direction } from '../general/Direction';
import { Building } from '../entity/Building';
import { ResourceType } from '../resource/Resource';
import { Updateable } from '../../engine/Updateable';

export const CHUNK_SIZE = 16;

export class Chunk implements Updateable {
	private readonly entities: Array<Array<Entity | null>> = [];
	private stock: Map<ResourceType, number> = new Map();
	private balance: Map<ResourceType, number> = new Map();

	constructor() {
		for (let y = 0; y < CHUNK_SIZE; y++) {
			this.entities.push([]);
			for (let x = 0; x < CHUNK_SIZE; x++) {
				this.entities[y].push(null);
			}
		}
	}

	public update(_time: number): void {
		this.stock.forEach((value, key) => {
			this.stock.set(key, value + (this.balance.get(key) ?? 0));
		});
	}

	public getAtPosition(x: number, y: number): Entity | null {
		if (x >= 0 && y >= 0 && x < CHUNK_SIZE && y < CHUNK_SIZE) {
			return this.entities[x][y];
		} else {
			throw new RangeError(`Can not get entity outside of chunk boundary (${ x }, ${ y })`);
		}
	}

	public setAtPosition(x: number, y: number, entity: Entity): void {
		if (x >= 0 && y >= 0 && x < CHUNK_SIZE && y < CHUNK_SIZE) {
			entity.position = { x, y };
			entity.neighbours.set(Direction.UP, this.entities?.[x]?.[y - 1] ?? null);
			entity.neighbours.set(Direction.DOWN, this.entities?.[x]?.[y + 1] ?? null);
			entity.neighbours.set(Direction.LEFT, this.entities?.[x - 1]?.[y] ?? null);
			entity.neighbours.set(Direction.RIGHT, this.entities?.[x + 1]?.[y] ?? null);

			this.entities?.[x]?.[y - 1]?.neighbours.set(Direction.DOWN, entity);
			this.entities?.[x]?.[y + 1]?.neighbours.set(Direction.UP, entity);
			this.entities?.[x - 1]?.[y]?.neighbours.set(Direction.RIGHT, entity);
			this.entities?.[x + 1]?.[y]?.neighbours.set(Direction.LEFT, entity);

			this.entities[x][y] = entity;
		} else {
			throw new RangeError(`Can not set entity outside of chunk boundary (${ x }, ${ y })`);
		}
	}

	public getStock(type: ResourceType): number {
		return this.stock.get(type) ?? 0;
	}

	public getBalance(type: ResourceType): number {
		return this.balance.get(type) ?? 0;
	}

	public placeBuilding(x: number, y: number, building: Building): void {
		this.setAtPosition(x, y, building);

		building.recipe.input?.forEach(input => this.growBalance(input.type, -1 * input.amount));
		building.recipe.output?.forEach(output => this.growBalance(output.type, output.amount));
	}

	public removeBuilding(building: Building) {
		if (this.entities[building.position.x][building.position.y] === building) {
			building.recipe.input?.forEach(input => this.growBalance(input.type, input.amount));
			building.recipe.output?.forEach(output => this.growBalance(output.type, -1 * output.amount));
			this.entities[building.position.x][building.position.y] = null;
		}
	}

	private growBalance(type: ResourceType, by: number): void {
		this.balance.set(type, this.getBalance(type) + by);
	}
}
