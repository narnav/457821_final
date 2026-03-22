import pandas as pd
import numpy as np

from train_trend_model import train_trend_model, FEATURE_COLUMNS


def show_feature_importance():
    model = train_trend_model()

    # Extract the logistic regression model
    clf = model.named_steps["clf"]

    coefficients = clf.coef_[0]

    importance_df = pd.DataFrame({
        "feature": FEATURE_COLUMNS,
        "coefficient": coefficients,
        "abs_importance": np.abs(coefficients)
    })

    importance_df = importance_df.sort_values(
        by="abs_importance",
        ascending=False
    )

    print("\nFeature Importance (Logistic Regression):")
    print(importance_df)


if __name__ == "__main__":
    show_feature_importance()
