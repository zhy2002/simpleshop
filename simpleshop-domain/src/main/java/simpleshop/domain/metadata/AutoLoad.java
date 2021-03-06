package simpleshop.domain.metadata;

import java.lang.annotation.ElementType;

/**
 * Getters annotated with AutoLoad will be initialised during object graph traversal.
 */
@java.lang.annotation.Target(ElementType.METHOD)
@java.lang.annotation.Retention(java.lang.annotation.RetentionPolicy.RUNTIME)
@java.lang.annotation.Documented
public @interface AutoLoad {

    /**
     * @return Groups that activates this AutoLoad.
     */
    String[] groups() default {""};
}
