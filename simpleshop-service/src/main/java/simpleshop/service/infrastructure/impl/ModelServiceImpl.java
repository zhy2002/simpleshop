package simpleshop.service.infrastructure.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import simpleshop.common.ObjectGraphDFS;
import simpleshop.data.PageInfo;
import simpleshop.data.infrastructure.HibernateDeProxyStrategy;
import simpleshop.data.infrastructure.ModelDAO;
import simpleshop.data.infrastructure.SpongeConfigurationException;
import simpleshop.data.metadata.ModelMetadata;
import simpleshop.dto.ModelSearch;
import simpleshop.service.MetadataService;
import simpleshop.service.infrastructure.JacksonObjectGraphFilter;
import simpleshop.service.infrastructure.JsonPreProcessor;
import simpleshop.service.infrastructure.ModelService;

import javax.validation.constraints.NotNull;
import java.io.Serializable;
import java.util.Collection;
import java.util.List;

/**
 * Base model service class.
 * [convention:transaction boundary]By default the public methods of a service that perform database operations are transaction boundary.
 */
public abstract class ModelServiceImpl<T, S extends ModelSearch> extends BaseServiceImpl implements ModelService<T, S> {

    /**
     * Child classes need to provide their modelDAO to the super class via this getter.
     * @return the DAO used by the implementation class.
     */
    protected abstract ModelDAO<T> getModelDAO();

    /**
     * Manually lazy load model properties if additional processing is required.
     * @param model model instance that was loaded by DAO.
     */
    protected void initialize(@NotNull T model) {
    }

    /**
     * Get a single model instance using hibernate get semantics.
     * @param id id.
     * @return null if not found.
     */
    @Transactional(readOnly = true)
    @Override
    public T getById(Serializable id) {

        ModelDAO<T> modelDAO = getModelDAO();
        boolean readonly = modelDAO.isSessionDefaultReadonly();
        if(!readonly)
            modelDAO.setSessionDefaultReadonly(true);
        try{
            T model = modelDAO.get(id);
            if(model != null){
                initialize(model);
                resolveLookupValues(model);
                modelDAO.detach(model);
            }
            return model;
        } finally {
            if(!readonly)
                modelDAO.setSessionDefaultReadonly(false);
        }
    }


    @Override
    public void sessionFlush() {
        getModelDAO().sessionFlush();
    }

    /**
     * The template method for proper searching of a list of model.Called form child class overriding method.
     * @param searchParams search parameters for the model.
     * @return a list of matching instances.
     */
    @Transactional(readOnly = true)
    public @NotNull List<T> search(@NotNull S searchParams){

        ModelDAO<T> modelDAO = getModelDAO();
        boolean readonly = modelDAO.isSessionDefaultReadonly();
        if(!readonly)
            modelDAO.setSessionDefaultReadonly(true);

        try{
            List<T> result = daoSearch(searchParams);
            for(T item : result){
                //initialize(item); initialise is for getById only.
                resolveLookupValues(item);
                modelDAO.detach(item);
            }
            return result;
        }finally{
            if(!readonly)
                modelDAO.setSessionDefaultReadonly(false);
        }
    }

    @Autowired
    private MetadataService metadataService;

    /**
     * To be implemented by child class.
     * @param searchParams search parameters for the model.
     * @return the search result.
     */
    @Transactional(readOnly = true)
    protected @NotNull List<T> daoSearch(S searchParams){

        //get search model metadata
        String searchModelName = searchParams.getClass().getSimpleName();
        ModelMetadata metadata = metadataService.getMetadata(searchModelName);
        if(metadata == null)
            throw new RuntimeException("Cannot find metadata for searchParams: " + searchModelName);

        //get target model metadata
        String targetModelName = searchModelName.replace("Search", "");
        ModelMetadata modelMetadata = metadataService.getMetadata(targetModelName);
        if(modelMetadata == null)
            throw new SpongeConfigurationException(String.format("Cannot find metadata for target model name '%s'", targetModelName));

        return getModelDAO().search(metadata, modelMetadata, searchParams);
    }

    /**
     * Save a model to the database.
     * @param model model instance to save..
     */
    @Transactional
    @Override
    public void save(@NotNull T model) {
        getModelDAO().save(model);
    }


    /**
     * {@inheritDoc}
     */
    @Transactional
    @Override
    public void delete(T model){
       getModelDAO().delete(model);
    }

    /**
     * {@inheritDoc}
     */
    @Transactional
    @Override
    public void delete(Serializable id){
        ModelDAO<T> modelDAO = getModelDAO();
        T domainObject = modelDAO.load(id);
        getModelDAO().delete(domainObject);
    }

    /**
     * The dummy implementation for models that do not support keyword search.
     * @param keywords keywords.
     * @param pageInfo search parameters.
     * @return matching models.
     */
    @Transactional(readOnly = true)
    @Override
    public @NotNull List<T> quickSearch(String keywords, PageInfo pageInfo) {

        List<T> list = daoQuickSearch(keywords, pageInfo);
        for (Object obj : list){
            resolveLookupValues(obj);
            getModelDAO().detach(obj);
        }

        return list;
    }

    /**
     * subclass to implement how to do quick search with DAO.
    */
    protected List<T> daoQuickSearch(String keywords, PageInfo pageInfo){
        return getModelDAO().quickSearch(keywords, pageInfo);
    }

    public void resolveLookupValues(Object domainObject){
        resolveObjectGraph(domainObject);
    }

    public void resolveObjectGraph(Object domainObject){
        resolveObjectGraph(domainObject, null);
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void resolveObjectGraph(Object domainObject, String group) {
        JsonPreProcessor inspector = new JsonPreProcessor();
        inspector.process(domainObject, group);
    }
}
