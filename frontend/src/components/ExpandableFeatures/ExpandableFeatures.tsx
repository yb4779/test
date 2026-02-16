import { useState, useEffect } from "react";
import { featuresApi } from "../../services/api";
import type { Feature } from "../../types";

export default function ExpandableFeatures() {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newFeature, setNewFeature] = useState({ name: "", description: "", category: "custom" });

  const fetchFeatures = () =>
    featuresApi.list().then((d: any) => setFeatures(d.features || []));

  useEffect(() => {
    fetchFeatures();
  }, []);

  const toggleFeature = async (id: number) => {
    await featuresApi.toggle(id);
    fetchFeatures();
  };

  const addFeature = async () => {
    if (!newFeature.name) return;
    await featuresApi.add(newFeature);
    setNewFeature({ name: "", description: "", category: "custom" });
    setShowAddForm(false);
    fetchFeatures();
  };

  const categories = [...new Set(features.map((f) => f.category))];

  return (
    <div>
      <div className="card-header">
        <h2>Features</h2>
        <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
          + Add Tool
        </button>
      </div>

      {showAddForm && (
        <div style={{ marginBottom: 12 }}>
          <div className="form-row">
            <input className="form-input" placeholder="Feature name"
              value={newFeature.name}
              onChange={(e) => setNewFeature({ ...newFeature, name: e.target.value })} />
            <select className="form-input" value={newFeature.category}
              onChange={(e) => setNewFeature({ ...newFeature, category: e.target.value })}>
              <option value="analysis">Analysis</option>
              <option value="data">Data</option>
              <option value="automation">Automation</option>
              <option value="visualization">Visualization</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div className="form-row">
            <input className="form-input" placeholder="Description"
              value={newFeature.description}
              onChange={(e) => setNewFeature({ ...newFeature, description: e.target.value })} />
            <button className="btn btn-primary" onClick={addFeature}>Save</button>
          </div>
        </div>
      )}

      {categories.map((cat) => (
        <div key={cat} style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", textTransform: "uppercase",
                        letterSpacing: 1, marginBottom: 6 }}>
            {cat}
          </div>
          <div className="features-grid">
            {features
              .filter((f) => f.category === cat)
              .map((feature) => (
                <div
                  key={feature.id}
                  className={`feature-card ${feature.is_enabled ? "enabled" : ""}`}
                  onClick={() => toggleFeature(feature.id)}
                >
                  <button
                    className={`feature-toggle ${feature.is_enabled ? "on" : ""}`}
                    onClick={(e) => { e.stopPropagation(); toggleFeature(feature.id); }}
                  />
                  <div className="feature-name">{feature.name.replace(/_/g, " ")}</div>
                  <div className="feature-desc">{feature.description}</div>
                </div>
              ))}
          </div>
        </div>
      ))}

      {features.length === 0 && <div className="loading">Loading features...</div>}
    </div>
  );
}
