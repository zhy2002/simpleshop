<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@attribute name="isFalse" fragment="true" required="false" %>
<%@variable name-given="username" scope="NESTED" %>

<c:choose>
    <c:when test="${not empty pageContext.request.userPrincipal}" >
        <c:set var="username" value="${pageContext.request.userPrincipal.name}" />
        <jsp:doBody/>
    </c:when>
    <c:otherwise>
        <jsp:invoke fragment="isFalse" />
    </c:otherwise>
</c:choose>
