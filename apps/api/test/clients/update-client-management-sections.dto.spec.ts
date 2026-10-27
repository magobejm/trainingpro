import { buildDefaultClientManagementSections } from '../../src/modules/clients/domain/client-management-section';
import { UpdateClientManagementSectionsDto } from '../../src/modules/clients/presentation/dto/update-client-management-sections.dto';

it('accepts a reordered list of every client section', () => {
  const items = buildDefaultClientManagementSections();
  const [first, ...rest] = items;
  const reordered = [...rest, first];

  expect(UpdateClientManagementSectionsDto.schema.parse({ items: reordered })).toEqual({ items: reordered });
});
