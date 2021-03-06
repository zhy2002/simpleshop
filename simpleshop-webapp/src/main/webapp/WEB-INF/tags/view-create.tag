<%-- All create views are wrapped in this tag..--%>
<%@tag trimDirectiveWhitespaces="true"  %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="ctrl" tagdir="/WEB-INF/tags/controls"  %>
<%@ taglib prefix="comm" tagdir="/WEB-INF/tags/common"  %>
<%@ taglib prefix="t" tagdir="/WEB-INF/tags" %>
<%@ taglib prefix="f" uri="sponge/functions" %>
<%@ taglib prefix="spring" uri="http://www.springframework.org/tags" %>

<%--########################## ATTRIBUTES ################################--%>
<%-- Title of the view. Can be static String value or Angularjs binding expression. --%>
<%@attribute name="title"%>
<%--name of the icon to use.--%>
<%@attribute name="icon"%>
<%@attribute name="controllerName" %>
<%--the css class for the panel--%>
<%@attribute name="cssClass" %>
<%@attribute name="noButtons" type="java.lang.Boolean" %>

<%--########################## ATTRIBUTE DEFAULT VALUES  ################################--%>


<%--########################## TAG CONTENT ################################--%>
<t:view>
    <c:if test="${empty title}">
        <comm:peek var="friendlyModelName" />
        <spring:message var="literal_createNew" code="jsp.literal.createNew" />
        <c:set var="title" value="${literal_createNew} ${friendlyModelName}" />
    </c:if>
    <comm:push value="&${f:uuid()};" var="viewId" />
    <comm:push value="${viewId}" var="replace_id_marker" />

    <t:view-frame id="${viewId}" title="${title}" cssClass="create-view ${cssClass}" controllerName="${controllerName}" >
        <jsp:attribute name="header">

        </jsp:attribute>
        <jsp:body>
            <ctrl:form name="${viewId}-form" editForm="${not noButtons}">

                <jsp:doBody/>

            </ctrl:form>
        </jsp:body>

    </t:view-frame>

    <comm:pop var="viewId" />
</t:view>