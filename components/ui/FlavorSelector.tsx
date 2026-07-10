"use client";

import {
  clearFlavorPreview,
  selectFlavor,
  setFlavorPreview,
  useSceneFlavor,
  type Flavor,
} from "@/lib/sceneStore";

const FLAVORS: ReadonlyArray<{ label: string; value: Flavor }> = [
  { label: "Original", value: "original" },
  { label: "Cherry", value: "cherry" },
  { label: "Vanilla", value: "vanilla" },
];

export function FlavorSelector() {
  const { selectedFlavor } = useSceneFlavor();

  return (
    <fieldset className="flavor-selector">
      <legend className="flavor-selector__legend">CHOOSE YOUR FLAVOR</legend>
      <div className="flavor-selector__options">
        {FLAVORS.map((flavor) => {
          const isSelected = selectedFlavor === flavor.value;

          return (
            <button
              key={flavor.value}
              className="flavor-selector__option"
              type="button"
              aria-pressed={isSelected}
              data-flavor={flavor.value}
              data-selected={isSelected ? "true" : undefined}
              onClick={() => {
                selectFlavor(flavor.value);
                clearFlavorPreview();
              }}
              onPointerEnter={(event) => {
                if (event.pointerType !== "touch") {
                  setFlavorPreview(flavor.value);
                }
              }}
              onPointerLeave={(event) => {
                if (event.currentTarget !== document.activeElement) {
                  clearFlavorPreview();
                }
              }}
              onFocus={() => setFlavorPreview(flavor.value)}
              onBlur={clearFlavorPreview}
            >
              <span className="flavor-selector__label">
                {flavor.label}
                {isSelected ? (
                  <span className="flavor-selector__status"> — Selected</span>
                ) : null}
              </span>
              <span className="flavor-selector__indicator" aria-hidden="true" />
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
