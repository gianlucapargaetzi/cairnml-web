import {TreeNode, TreeNodeMetadata} from '../shared/experiments-compare-details.model';

export type TreeNodeTransformerFn<T = any> = (node: any, key: string, path: string[], extraParams: any) => T;
export type TreeNodeMetaTransformerFn = (node: any, key: string, path: string[], extraParams: any) => TreeNodeMetadata;

export class TreeBuilderService {

  constructor() {
  }

  buildTreeFromJson<V>(
    obj: Record<string, any>,
    transformer: TreeNodeTransformerFn,
    metaTransformer?: TreeNodeMetaTransformerFn,
    transformerExtraParams?: any
  ): TreeNode<V> {
    const _metaTransformer = metaTransformer ? metaTransformer : () => ({classStyle: null});
    return {
      data    : {} as any,
      metaData: {} as any,
      parent  : null,
      children: isObject(obj) && !obj.dataDictionary ?
        this.buildTreeFromJsonRec(obj, transformer, _metaTransformer, transformerExtraParams) :
        null
    };
  }

  private buildTreeFromJsonRec<V>(obj: Record<string, any>,
    transformer: TreeNodeTransformerFn<V>,
    metaTransformer: TreeNodeMetaTransformerFn,
    transformerExtraParams?: any,
    level            = 0,
    parent: TreeNode<V> = null,
    path             = [],
  ): TreeNode<V>[] {
    return Object.keys(obj).reduce<TreeNode<V>[]>((accumulator, key) => {
      const _path          = path.concat([key]);
      const node: TreeNode<V> = {
        data    : transformer(obj, key, path, transformerExtraParams),
        metaData: metaTransformer(obj, key, path, transformerExtraParams),
        parent  : parent
      };
      const value          = obj[key];
      if (value != null) {
        if (typeof value === 'object' && !value.dataDictionary) {
          node.children = this.buildTreeFromJsonRec(
            (value as any), transformer, metaTransformer, transformerExtraParams, level + 1, node, _path
          );
        }
      }
      accumulator.push(node);
      return accumulator;
    }, []);
  }
}

// TODO: move to utils.
function isObject(val) {
  return val && typeof val === 'object';
}

export const treeBuilderService = new TreeBuilderService();

