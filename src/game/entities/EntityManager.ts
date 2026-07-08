import type { ComponentMap, ComponentType, Entity, EntityId } from '../components/types';
import { createEntity } from '../components/index';

export class EntityManager {
  private readonly entities = new Map<EntityId, Entity>();

  add(entity: Entity): Entity {
    this.entities.set(entity.id, entity);
    return entity;
  }

  create(components: ComponentMap): Entity {
    return this.add(createEntity(components));
  }

  get(id: EntityId): Entity | undefined {
    return this.entities.get(id);
  }

  remove(id: EntityId): void {
    this.entities.delete(id);
  }

  getAll(): Entity[] {
    return [...this.entities.values()];
  }

  query(...required: ComponentType[]): Entity[] {
    return this.getAll().filter((entity) =>
      required.every((type) => entity.components[type] !== undefined),
    );
  }

  findPlayer(): Entity | undefined {
    return this.getAll().find((entity) => entity.components.player !== undefined);
  }
}
