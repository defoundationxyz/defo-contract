import { Contract } from "ethers";
import { ethers } from "hardhat";

const FacetCutAction = { Add: 0, Replace: 1, Remove: 2 };

type Selectors = {
  signatures: string[];
  contract: Contract | null;
  remove: any;
  get: any;
};

// get function selectors from ABI
function getSelectors(contract: Contract) {
  const signatures = Object.keys(contract.interface.functions);
  const selectors: Selectors = {
    signatures: [],
    contract: null,
    remove: null,
    get: null,
  };
  selectors.signatures = signatures.reduce((acc: string[], val: string) => {
    if (val !== "init(bytes)") {
      acc.push(contract.interface.getSighash(val));
    }
    return acc;
  }, []);
  selectors.contract = contract;

  // used with getSelectors to remove selectors from an array of selectors
  // functionNames argument is an array of function signatures
  selectors.remove = function (functionNames: string[]): Selectors {
    this.signatures = this.signatures.filter((v: string) => {
      for (const functionName of functionNames) {
        if (this.contract && v === this.contract.interface.getSighash(functionName)) {
          return false;
        }
      }
      return true;
    });
    return this;
  };

  // used with getSelectors to get selectors from an array of selectors
  // functionNames argument is an array of function signatures
  selectors.get = function (functionNames: string[]): Selectors {
    this.signatures = this.signatures.filter((v: string) => {
      for (const functionName of functionNames) {
        if (this.contract && v === this.contract.interface.getSighash(functionName)) {
          return true;
        }
      }
      return false;
    });
    return this;
  };
  return selectors;
}

// get function selector from function signature
function getSelector(func: string) {
  const abiInterface = new ethers.utils.Interface([func]);
  return abiInterface.getSighash(ethers.utils.Fragment.from(func));
}

// remove selectors using an array of signatures
function removeSelectors(selectors: Selectors, signatures: string[]) {
  const iface = new ethers.utils.Interface(signatures.map(v => "function " + v));
  const removeSelectors = signatures.map(v => iface.getSighash(v));
  selectors.signatures = selectors.signatures.filter(v => !removeSelectors.includes(v));
  return selectors;
}

type Facet = {
  facetAddress: string;
};
// find a particular address position in the return value of diamondLoupeFacet.facets()
function findAddressPositionInFacets(facetAddress: string, facets: Facet[]) {
  for (let i = 0; i < facets.length; i++) {
    if (facets[i].facetAddress === facetAddress) {
      return i;
    }
  }
}

export { getSelectors, getSelector, FacetCutAction, removeSelectors, findAddressPositionInFacets };
