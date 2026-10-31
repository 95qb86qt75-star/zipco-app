import * as React from 'react';

// Expand only the stateless presentation boundaries introduced by the feature
// split. Controllers, sheets and existing stateful children remain under the
// individual test's harness, so permission/recovery assertions stay real.
const presentations = new Set([
  'RequestsHeader', 'BusinessAttentionSummary', 'RequestStatusTabs',
  'CustomerAttentionSummary', 'RequestResults', 'HistoryTransferOverlay',
  'HistoryFilterDialog', 'SearchHeader', 'SearchDistanceDialog', 'SearchResults',
  'BusinessProfileHeader', 'BusinessCatalogSection', 'CatalogProductPreview',
  'BusinessesSearchHeader', 'BusinessDistanceDialog', 'BusinessResultsSection',
  'ProductSelectionCard', 'ScheduleSelectionPanel', 'ReferencePhotoAttachment',
  'ReferencePhotoDialog', 'ServiceOrderSummary', 'FavoritesScreen',
  'HomeDiscoveryHeader', 'HomeLocationDialog', 'CatalogProductCard',
  'SearchResultCard', 'BusinessResultCard', 'FavoriteCard', 'SelectedProductCard',
  'HomeCategoryCard', 'BusinessEmbeddedCoordinationDetail',
  'CustomerEmbeddedCoordinationDetail', 'CustomerInitialCoordinationCard',
  'CustomerCoordinationQuestionCard', 'CustomerWhatsappProgressCard',
]);

export function expandPresentationTree(root: React.ReactNode): React.ReactNode {
  if (Array.isArray(root)) return root.map(expandPresentationTree);
  if (!React.isValidElement<Record<string, unknown>>(root)) return root;
  const type = root.type;
    if (typeof type === 'function' && root.props.model &&
        (type.name.endsWith('View') || presentations.has(type.name))) {
      return expandPresentationTree((type as (props: unknown) => React.ReactNode)(root.props));
    }
  return Object.hasOwn(root.props, 'children')
    ? React.cloneElement(root, {children: expandPresentationTree(root.props.children as React.ReactNode)})
    : root;
}

export function renderPresentationRoot(root: React.ReactElement): React.ReactElement {
  const children = React.Children.toArray(expandPresentationTree(root));
  if (children.length !== 1 || !React.isValidElement(children[0])) {
    throw new Error('Expected one presentation root');
  }
  return children[0];
}
