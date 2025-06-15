// crafting-ui.ts - Crafting User Interface
import { CurrencySystem } from './currency-system';

export interface CraftingUIState {
  selectedCurrency: string | null;
  selectedItem: any | null;
  isActive: boolean;
}

export class CraftingUI {
  private currencySystem: CurrencySystem;
  private inventorySystem: any;
  private selectedCurrency: string | null;
  private selectedItem: any | null;
  private isActive: boolean;

  constructor(currencySystem: CurrencySystem, inventorySystem: any) {
    this.currencySystem = currencySystem;
    this.inventorySystem = inventorySystem;
    this.selectedCurrency = null;
    this.selectedItem = null;
    this.isActive = false;
  }

  init(): void {
    this.createUI();
    this.bindEvents();
  }

  private createUI(): void {
    const craftingBench = document.createElement('div');
    craftingBench.id = 'crafting-bench';
    craftingBench.className = 'crafting-bench hidden';
    craftingBench.innerHTML = `
      <div class="crafting-header">
        <h2>Crafting Bench</h2>
        <button class="close-btn" id="close-crafting">×</button>
      </div>
      <div class="crafting-content">
        <div class="currency-panel">
          <h3>Currency</h3>
          <div id="currency-grid" class="currency-grid"></div>
        </div>
        <div class="item-panel">
          <h3>Item to Modify</h3>
          <div id="item-slot" class="item-slot empty">
            <span class="placeholder">Place item here</span>
          </div>
          <div id="item-preview" class="item-preview"></div>
        </div>
        <div class="result-panel">
          <h3>Result Preview</h3>
          <div id="result-preview" class="result-preview"></div>
          <button id="apply-currency" class="apply-btn" disabled>Apply Currency</button>
        </div>
      </div>
    `;

    document.body.appendChild(craftingBench);
    this.addStyles();
  }

  private addStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      .crafting-bench {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 800px;
        height: 600px;
        background: #2a2a2a;
        border: 2px solid #666;
        border-radius: 8px;
        color: white;
        z-index: 1000;
      }
      
      .crafting-bench.hidden {
        display: none;
      }
      
      .crafting-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 20px;
        background: #333;
        border-bottom: 1px solid #666;
      }
      
      .crafting-content {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        height: calc(100% - 60px);
        gap: 10px;
        padding: 20px;
      }
      
      .currency-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 5px;
        max-height: 400px;
        overflow-y: auto;
      }
      
      .currency-item {
        width: 50px;
        height: 50px;
        border: 1px solid #666;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        background: #444;
      }
      
      .currency-item:hover {
        background: #555;
      }
      
      .currency-item.selected {
        border-color: #ffd700;
        background: #665500;
      }
      
      .item-slot {
        width: 100px;
        height: 100px;
        border: 2px dashed #666;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        margin-bottom: 10px;
      }
      
      .item-slot.empty {
        color: #999;
      }
      
      .apply-btn {
        width: 100%;
        padding: 10px;
        background: #4a90e2;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 16px;
      }
      
      .apply-btn:disabled {
        background: #666;
        cursor: not-allowed;
      }
      
      .apply-btn:hover:not(:disabled) {
        background: #357abd;
      }
    `;
    document.head.appendChild(style);
  }

  private bindEvents(): void {
    document.getElementById('close-crafting')?.addEventListener('click', () => {
      this.hide();
    });

    document.getElementById('apply-currency')?.addEventListener('click', () => {
      this.applyCurrency();
    });
  }

  show(): void {
    this.isActive = true;
    const bench = document.getElementById('crafting-bench');
    if (bench) {
      bench.classList.remove('hidden');
    }
    this.populateCurrencyGrid();
  }

  hide(): void {
    this.isActive = false;
    const bench = document.getElementById('crafting-bench');
    if (bench) {
      bench.classList.add('hidden');
    }
  }

  private populateCurrencyGrid(): void {
    const grid = document.getElementById('currency-grid');
    if (!grid) return;

    grid.innerHTML = '';
    const currencies = this.currencySystem.getCurrencyTypes();

    for (const [currencyId, currency] of Object.entries(currencies)) {
      const currencyElement = document.createElement('div');
      currencyElement.className = 'currency-item';
      currencyElement.dataset.currencyId = currencyId;
      currencyElement.title = currency.description;
      currencyElement.textContent = currency.name.substring(0, 3);

      currencyElement.addEventListener('click', () => {
        this.selectCurrency(currencyId);
      });

      grid.appendChild(currencyElement);
    }
  }

  selectCurrency(currencyId: string): void {
    this.selectedCurrency = currencyId;
    
    document.querySelectorAll('.currency-item').forEach(el => {
      el.classList.remove('selected');
    });
    
    const element = document.querySelector(`[data-currency-id="${currencyId}"]`);
    if (element) {
      element.classList.add('selected');
    }

    this.updateApplyButton();
  }

  setItem(item: any): void {
    this.selectedItem = item;
    this.updateItemPreview();
    this.updateApplyButton();
  }

  private updateItemPreview(): void {
    const preview = document.getElementById('item-preview');
    if (!preview || !this.selectedItem) return;

    preview.innerHTML = `
      <div class="item-name">${this.selectedItem.name}</div>
      <div class="item-rarity">${this.selectedItem.rarity}</div>
      <div class="item-level">Item Level: ${this.selectedItem.itemLevel || 1}</div>
    `;
  }

  private updateApplyButton(): void {
    const button = document.getElementById('apply-currency') as HTMLButtonElement;
    if (!button) return;

    button.disabled = !(this.selectedCurrency && this.selectedItem);
  }

  private applyCurrency(): void {
    if (!this.selectedCurrency || !this.selectedItem) return;

    const result = this.currencySystem.applyCurrency(this.selectedCurrency, this.selectedItem);
    
    if (result.success) {
      this.updateItemPreview();
      this.showResult('Currency applied successfully!');
    } else {
      this.showResult(`Error: ${result.error}`);
    }
  }

  private showResult(message: string): void {
    const preview = document.getElementById('result-preview');
    if (preview) {
      preview.innerHTML = `<div class="result-message">${message}</div>`;
    }
  }

  getState(): CraftingUIState {
    return {
      selectedCurrency: this.selectedCurrency,
      selectedItem: this.selectedItem,
      isActive: this.isActive
    };
  }
}

export default CraftingUI;