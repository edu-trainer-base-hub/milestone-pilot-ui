import { post } from "@/services/ApiService";
import { type Locale5 } from "@/services/SettingsApiClient";

export const MenuCategory = {
  MATH: "MATH",
  ARCADE: "ARCADE",
  INFO: "INFO",
  COACH: "COACH",
} as const;
export type MenuCategory = (typeof MenuCategory)[keyof typeof MenuCategory];

export const MenuType = {
  GAME: "GAME",
  COACH: "COACH",
  // Add other types as they become known
} as const;
export type MenuType = (typeof MenuType)[keyof typeof MenuType];

export interface ApiMenuItem {
  id: string;
  type: string | MenuType;
  path: string;
  name: string;
  title: string;
  description: string;
  category: string | MenuCategory;
  iconKey: string;
  badge: string | null;
  tags: string[];
}

export interface MenuItemsFiltersRequest {
  searchString: string;
  category: string | MenuCategory;
  type: string | MenuType;
}

export interface Pageable {
  offset: number;
  pageNumber: number;
  pageSize: number;
  paged: boolean;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  unpaged: boolean;
}

export interface Page<T> {
  content: T[];
  empty: boolean;
  first: boolean;
  last: boolean;
  number: number;
  numberOfElements: number;
  pageable: Pageable;
  size: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  totalElements: number;
  totalPages: number;
}

class MenuApiClient {
  /**
   * Fetches menu items with optional filters and pagination.
   * @param filters - Search criteria (searchString, category, type)
   * @param page - Page number (starting from 0)
   * @param size - Page size
   * @param locale - 5-character locale string (e.g., "en-US")
   */
  static async retrieveMenu(
    filters: MenuItemsFiltersRequest,
    page: number = 0,
    size: number = 20,
    locale?: Locale5
  ): Promise<Page<ApiMenuItem>> {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("size", size.toString());
    if (locale) {
      params.append("locale", locale);
    }

    const url = `/api/v1/menu/filters?${params.toString()}`;
    return post<Page<ApiMenuItem>>(url, filters);
  }
}

export default MenuApiClient;
