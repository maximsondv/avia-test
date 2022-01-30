export interface Filters {
  stops: (string|number)[];
  company: string;
  sort: SortOptions
}

type SortOptions = 'cheapest' | 'fastest' | 'optimal'
