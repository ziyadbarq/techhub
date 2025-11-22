/**
 * SearchResult Domain Entity
 * Represents a search result from global search
 * Contains minimal information for display in command palette
 */

export type SearchEntityType =
  | "asset"
  | "person"
  | "vendor"
  | "configuration-item"
  | "contract"
  | "license-product"
  | "asset-category"
  | "asset-model"
  | "location"
  | "stock-location";

export interface SearchResultProps {
  id: string;
  entityType: SearchEntityType;
  title: string;
  subtitle: string | null;
  metadata: Record<string, string> | null;
  url: string;
}

export class SearchResult {
  private constructor(private props: SearchResultProps) {}

  /**
   * Factory method: Create a search result
   */
  static create(props: SearchResultProps): SearchResult {
    SearchResult.validate(props);
    return new SearchResult(props);
  }

  /**
   * Factory method: Reconstitute from persistence
   */
  static reconstitute(props: SearchResultProps): SearchResult {
    return new SearchResult(props);
  }

  // Validation
  private static validate(props: SearchResultProps): void {
    if (!props.id || props.id.trim().length === 0) {
      throw new Error("Search result ID cannot be empty");
    }

    if (!props.title || props.title.trim().length === 0) {
      throw new Error("Search result title cannot be empty");
    }

    if (!props.url || props.url.trim().length === 0) {
      throw new Error("Search result URL cannot be empty");
    }
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get entityType(): SearchEntityType {
    return this.props.entityType;
  }

  get title(): string {
    return this.props.title;
  }

  get subtitle(): string | null {
    return this.props.subtitle;
  }

  get metadata(): Record<string, string> | null {
    return this.props.metadata;
  }

  get url(): string {
    return this.props.url;
  }

  /**
   * Convert to plain object
   */
  toObject(): SearchResultProps {
    return { ...this.props };
  }

  /**
   * Compare with another search result
   */
  equals(other: SearchResult): boolean {
    return (
      this.props.id === other.id && this.props.entityType === other.entityType
    );
  }
}
