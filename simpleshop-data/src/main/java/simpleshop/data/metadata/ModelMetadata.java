package simpleshop.data.metadata;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import javafx.util.Pair;

import java.util.List;
import java.util.Map;
import java.util.Set;


@JsonIgnoreProperties({"modelClass", "aliasDeclarations", "noneSummaryProperties", "sortProperties"})
public class ModelMetadata {

    private String name;
    private String icon;
    private ModelType type;
    private boolean searchable = false;
    private String displayFormat;   //how to convert to string using pipelined ajs filters.
    private String interpolateFormat;//format for the interpolation filter
    private Map<String, PropertyMetadata> PropertyMetadataMap;

    private Set<String> noneSummaryProperties;
    private List<AliasDeclaration> aliasDeclarations;
    private List<SortProperty> sortProperties;
    private Class<?> modelClass;

    public Map<String, PropertyMetadata> getPropertyMetadataMap() {
        return PropertyMetadataMap;
    }

    public void setPropertyMetadataMap(Map<String, PropertyMetadata> PropertyMetadataMap) {
        this.PropertyMetadataMap = PropertyMetadataMap;
    }

    public Pair<ModelMetadata, PropertyMetadata> getPathMetadata(String path){
        String[] parts = path.split("\\.");
        ModelMetadata modelMetadata = this;
        PropertyMetadata propertyMetadata = null;
        for (int i = 0; i < parts.length; i++) {
            if (modelMetadata == null)
                throw new RuntimeException("Failed to reflect property path: " + path);
            propertyMetadata = modelMetadata.getPropertyMetadataMap().get(parts[i]);
            if(i < parts.length - 1)
                modelMetadata = propertyMetadata.getReturnTypeMetadata();
        }
        return new Pair<>(modelMetadata, propertyMetadata);
    }

    public ModelMetadata getPropertyOwnerMetadata(String path){
        Pair<ModelMetadata, PropertyMetadata> pair = getPathMetadata(path);
        return pair.getKey();
    }

    public PropertyMetadata getPropertyMetadata(String path) {
        Pair<ModelMetadata, PropertyMetadata> pair = getPathMetadata(path);
        return pair.getValue();
    }

    public Set<String> getNoneSummaryProperties() {
        return noneSummaryProperties;
    }

    public void setNoneSummaryProperties(Set<String> noneSummaryProperties) {
        this.noneSummaryProperties = noneSummaryProperties;
    }

    public String getIcon() {
        return icon;
    }

    public void setIcon(String icon) {
        this.icon = icon;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public boolean isSearchable() {
        return searchable;
    }

    public void setSearchable(boolean searchable) {
        this.searchable = searchable;
    }

    public String getDisplayFormat() {
        return displayFormat;
    }

    public void setDisplayFormat(String displayFormat) {
        this.displayFormat = displayFormat;
    }

    public String getInterpolateFormat() {
        return interpolateFormat;
    }

    public void setInterpolateFormat(String interpolateFormat) {
        this.interpolateFormat = interpolateFormat;
    }

    public Class<?> getModelClass() {
        return modelClass;
    }

    public ModelType getType() {
        return type;
    }

    public void setType(ModelType type) {
        this.type = type;
    }

    public void setModelClass(Class<?> modelClass) {
        this.modelClass = modelClass;
    }

    public enum ModelType {

        DOMAIN, DTO, LOOKUP, EMBEDDED, COLLECTION
    }

    public List<AliasDeclaration> getAliasDeclarations() {
        return aliasDeclarations;
    }

    public void setAliasDeclarations(List<AliasDeclaration> aliasDeclarations) {
        this.aliasDeclarations = aliasDeclarations;
    }

    public List<SortProperty> getSortProperties() {
        return sortProperties;
    }

    public void setSortProperties(List<SortProperty> sortProperties) {
        this.sortProperties = sortProperties;
    }
}
